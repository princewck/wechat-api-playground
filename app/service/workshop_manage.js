const { Service } = require('egg');
const moment = require('moment');

module.exports = class WorshopManageService extends Service {

  async setSynced(userId) {
    await this.app.mysql.insert('work_sync_stat', {user_id: userId});
  }

  async getSyncStat(userId) {
    return await this.app.mysql.get('work_sync_stat', {user_id: userId});
  }

  // 向前兼容数据
  async syncStorageData(userId, data) {
    console.log(userId, data);
    let countSetting = null;
    for (let key in data) {
      const row = data[key];
      const d = moment(key);
      const valid = d.isValid();
      const date = d.format('YYYY-MM-DD');
      const old = await this.app.mysql.get('work_data', { date });
      if (old) {
        console.log(old);
        console.log('data in ', date, ' already exist, skipping...');
        continue;
      }
      // 同步基本信息
      if (valid) {
        const primaryPayload = {
          date,
          primary_hours: safeDigit(row.primary),
          primary_price: safeDigit(row.primaryPrice),
          absent: 0,
          duty_type: row.night ? 'night' : null,
          comment: '',
          user_id: userId,
        };

        const result = await this.app.mysql.insert('work_data', primaryPayload);
        if (result.affectedRows !== 1) {
          this.logger.error('work_data insert error');
        }

        const record = await this.app.mysql.get('work_data', { date });
        console.log('record inserted', record);
        // 获取刚才插入的id
        const workDataId = record.id;

        // 同步加班信息
        let extras = row.extras;
        if (!(extras instanceof Array)) {
          extras = [];
        }

        for (let i = 0; i < extras.length; i++) {
          const extra = extras[i];
          const extraPayload = {
            work_data_id: workDataId,
            type: extra.type,
            hours: extra.value,
            price: extra.price,
          }
          await this.app.mysql.insert('work_data_extra', extraPayload);
        }

        // 同步计件信息
        if (row.count > 0) {
          if (!countSetting) {
            countSetting = await this.app.mysql.get('work_setting_piece', {
              user_id: userId,
            });
          }
          const piecePayload = {
            // 必须保证settings先同步完成才有这个id
            count_setting_id: countSetting && countSetting.id || null,
            count: data.count,
            price: safeDigit(data.piecePrice),
          };
          await this.app.mysql.insert('work_data_piece', piecePayload);
        }
      }
    }
  }

  // 向前兼容旧版设置
  async syncStorageSetting(userId, data) {
    const extra = data.extraCategories || {};
    const conn = await this.app.mysql.beginTransaction();
    const setting = {
      user_id: userId,
      calc_method: data.calcMethod || 'primary_with_extra',
      per_hour_sallary: this.ctx.helper.safeDigit(data.sallaryPerHour),
      base_month_sallary: this.ctx.helper.safeDigit(data.baseSallary),
      month_start: data.monthStart || 1,
      weekday_extra_price: safeDigit(extra.weekday),
      weekend_extra_price: safeDigit(extra.weekend),
      holiday_extra_price: safeDigit(extra.holiday),
    }
    const pieceSetting = {
      user_id: userId,
      name: '计件类型1',
      status: 1,
      price: data.pieceSallary,
    };
    const settingExist = await this.app.mysql.get('work_setting', {user_id: userId});
    if (!settingExist) {
      await conn.insert('work_setting', setting);
      this.ctx.logger.info(`work_setting of user id:${userId} already exists`);
    }
    const pieceSettingExist = await this.app.mysql.get('work_setting_piece', {user_id: userId});
    if (!pieceSettingExist) {
      await conn.insert('work_setting_piece', pieceSetting);
      this.ctx.logger.info('work_setting_piece already exists');
    }
    await conn.commit();
  }


  // 获取设置
  async getSetting(userId) {
    const setting = await this.app.mysql.get('work_setting', { user_id: userId });
    if (!setting) {
      return null;
    }
    const pieceSetting = await this.app.mysql.select('work_setting_piece', { where: { user_id: userId, status: 1 } });
    const {
      calc_method,
      weekday_extra_price = 0,
      weekend_extra_price = 0,
      holiday_extra_price = 0,
      per_night_extra = 0,
      base_month_sallary = 0,
      per_hour_sallary = 0,
      month_start = 1,
    } = setting;
    return {
      calc_method,
      weekday_extra_price,
      weekend_extra_price,
      holiday_extra_price,
      per_night_extra,
      base_month_sallary,
      per_hour_sallary,
      month_start,
      piece_info: pieceSetting,
    };
  }

  async updateSetting(userId, data) {
    const {
      calc_method,
      per_hour_sallary,
      base_month_sallary,
      month_start,
      weekday_extra_price,
      weekend_extra_price,
      holiday_extra_price,
      per_night_extra,
      piece_info,
    } = data;
    const record = await this.app.mysql.get('work_setting', { user_id: userId });
    const conn = await this.app.mysql.beginTransaction();
    const setting = {
      id: record.id,
      user_id: userId,
      ...(calc_method ? { calc_method } : {}),
      ...(per_hour_sallary ? { per_hour_sallary } : {}),
      ...(base_month_sallary ? { base_month_sallary } : {}),
      ...(month_start ? { month_start } : {}),
      ...(weekday_extra_price ? { weekday_extra_price } : {}),
      ...(weekend_extra_price ? { weekend_extra_price } : {}),
      ...(holiday_extra_price ? { holiday_extra_price } : {}),
      ...(per_night_extra ? { per_night_extra }: {}),
    }
    try {
      await conn.update('work_setting', setting);
      if (piece_info && piece_info.length) {
        for (let i = 0; i < piece_info.length; i++) {
          const info = piece_info[i];
          const payload = {
            ...(info.id ? { id: info.id } : {}),
            user_id: userId,
            price: info.price,
            name: info.name,
            status: info.status,
          }
          if (info.id) {
            await conn.update('work_setting_piece', info);
          } else {
            await conn.insert('work_setting_piece', payload);
          }
        }
      }
      await conn.commit();
    } catch (e) {
      this.logger.error(e);
      await conn.rollback();
      throw new Error(e);
    }
  }

  // 创建用户时，初始化一下设置
  async createDefaultSetting(userId) {
    const setting = {
      user_id: userId,
      calc_method: 'primary_with_extra',
      per_hour_sallary: 0,
      base_month_sallary: 0,
      month_start: 1,
      weekday_extra_price: 0,
      weekend_extra_price: 0,
      holiday_extra_price: 0,
    }
    const pieceSetting = {
      user_id: userId,
      name: '计件类型1',
      status: 1,
      price: 0,
    };
    await this.app.mysql.insert('work_setting', setting);
    await this.app.mysql.insert('work_setting_piece', pieceSetting);
  }

  // // 获取一段时间的数据 ????
  // async getData(userId, start, end) {
  //   const settings = await this.app.mysql.select('work_data', {
  //     where: {
  //       date: {
  //         $between: [start, end],
  //       },
  //       user_id: userId,
  //     }
  //   });
  //   for (let i = 0; i < settings.length; i++) {
  //     const calcMethod = setting.calc_method || '';
  //     if (calcMethod.includes('extra')) {
  //       const setting = settings[i];
  //       const extra = await this.app.mysql.get('work_data_extra', {
  //         work_data_id: setting.id
  //       });
  //       settings[i].extras = [extra];
  //     }
  //     if (calcMethod === 'by_count') {
  //       const pieceInfo = await this.app.mysql.select('work_data_piece', {
  //         where: {
  //           work_data_id: setting.id
  //         }
  //       });
  //       settings[i].piece_info = pieceInfo;
  //     }
  //   }
  //   return settings;
  // }

  // 更新某天的数据
  async update(userId, date, data) {
    const fmtDate = moment(date).format('YYYY-MM-DD');
    let record = await this.app.mysql.get('work_data', {date: fmtDate});
    const { 
      primary_hours, 
      primary_price, 
      absent, 
      duty_type, 
      comment, 
      extras, 
      piece_info 
    } = data;
    const payload = {
      date: fmtDate,
      user_id: userId,
      ...(primary_hours ? {primary_hours} : {}),
      ...(primary_price ? { primary_price } : {}),
      ...(absent ? {absent}: {}),
      ...(duty_type ? {duty_type} : {}),
      ...(comment ? { comment } : {}),
    };
    if (record && record.id) {
      await this.app.mysql.update('work_data', {id: record.id, ...payload});
    } else {
      await this.app.mysql.insert('work_data', payload);
      record = await this.app.mysql.get('work_data', {user_id: userId, date: fmtDate});
    }
    if (extras && extras.length) {
      const extra = extras[0];
      const extraPayload = {
        work_data_id: record.id,
        type: extra.type,
        price: extra.price,
        hours: extra.hours,
      };
      const exist = await this.app.mysql.get('work_data_extra', {work_data_id: record.id});
      if (exist) {
        await this.app.mysql.update('work_data_extra', {
          id: exist.id, 
          ...extraPayload,
        })
      } else {
        await this.app.mysql.insert('work_data_extra', extraPayload);
      }
    }

    if (piece_info && piece_info.length) {
      try {
        const conn = await this.app.mysql.beginTransaction();
        await conn.delete('work_data_piece', {
          work_data_id: record.id,
        });
        rows = piece_info.map(info => {
          return {
            count_setting_id: info.setting_id,
            count: info.count,
            price: info.price,
            work_data_id: record.id,
          };
        });
        await conn.insert('work_data_piece', rows);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
      }
    }

  }

  async getWorkData(userId, start, end) {
    if (!start) {
      start = moment().startOf('month').format('YYYY-NN-DD');
    }
    if (!end) {
      end = moment().endOf('month').format('YYYY-MM-DD');
    }
    const setting = await this.getSetting(userId);
    const workDataList = await this.app.mysql.query(`
    select * from work_data where user_id = ? and \`date\` >= ? and \`date\` <= ?
    `, [userId, start, end]);
    for (let i = 0; i < workDataList.length; i ++) {
      try {
        const item = workDataList[i];
        let extras = [];
        let pieceInfo = [];
        if (setting.calc_method === 'by_count') {
          pieceInfo = await this.app.mysql.select('work_data_piece', {where: {work_data_id: item.id}});
        }
        if (setting.calc_method && setting.calc_method.includes('extra')) {
          extras = await this.app.mysql.select('work_data_extra', {where: {work_data_id: item.id}});
        }
        item.extras = extras;
        item.piece_info = pieceInfo;        
      } catch (e) {
        this.logger.error(e);
        console.error(e);
      }
    }
    const result = workDataList.reduce((map, item) => {
      map[moment(item.date).format('YYYY-MM-DD')] = item;
      return map;
    }, {});
    return result;
  }

  // 获取一段时间内的工资计算结果
  async getCalcInfo(userId, start, end) {
    const data = {
      primaryDays: 0,
      primaryHours: 0,
      extraDays: 0,
      nightDays: 0,
      weekdayExtraHours: 0,
      weekendExtraHours: 0,
      holidayExtraHours: 0,
      extraHours: 0,
      totalHours: 0,
      totalSallary: 0,
      primarySallary: 0,
      extraSallary: 0,
      totalPieces: 0,
      pieceInfo: [],
      pieceSallary: 0,
      calcMethod: null,
    };
    let config = await this.app.mysql.get('work_setting', {user_id: userId});

    data.calcMethod = config.calc_method;
  
    // const pieceConfig = await this.app.mysql.select('work_setting_piece', {where: {user_id: userId}});
    const { 
      per_hour_sallary = 0, 
      calc_method ,
      base_month_sallary = 0,
      month_start = 1,
      piece_price = 0,
      per_night_extra = 0,
    } = config || {};  

    let pieceSettings;

    if (!start && !end) {
      // 如果不指定，返回当前结算周期计算结果
      start = moment().date(month_start);
      if (start.isAfter(moment())) {
        start.subtract(1, 'months');
      }
      end = start.clone().add(1, 'months').subtract(1, 'days');
    }
    const days = (moment(end) - moment(start))/(1000 * 3600 * 24);
    let durationMonths = Math.floor(days/30) + Math.floor((days%30+7)/30);
    durationMonths = durationMonths < 0 ? 0 : durationMonths;
    data.start = moment(start).clone().format('YYYY-MM-DD');
    data.end = moment(end).clone().format('YYYY-MM-DD');
    const _end = moment(data.end).clone().add(1, 'seconds');
    const workData = await this.getWorkData(userId, data.start, _end.format('YYYY-MM-DD'));    
    for (
      let i = moment(start).format('YYYY-MM-DD');
      moment(i).isBefore(_end);
      i = moment(i).clone()
        .add(1, 'days')
        .format('YYYY-MM-DD')
    ) {
      if (!workData[i]) {
        continue;
      }

      const dayInfo = workData[i];
      const night = dayInfo.duty_type === 'night';
      if (night) {
        data.nightDays += 1;
      }
      const { primary_hours, primary_price, id } = dayInfo;
      if (primary_hours) {
        data.primaryDays += 1;
        data.primaryHours += safeDigit(primary_hours);
        if (isNaN(primary_price) || primary_price == null) {
          // 如果没有数据则给他设置一下
          // 此策略以后可能会废弃
          await this.app.mysql.update('work_data', {id, primary_price: per_hour_sallary });
          data.primaryPrice = per_hour_sallary;
        } else {
          data.primaryPrice = primary_price;
        }
        data.primarySallary += safeDigit(primary_hours) * data.primaryPrice;
      }

      // 计算加班信息
      const extra = await this.app.mysql.get('work_data_extra', { work_data_id: id });
      if (extra) {
        const { id: extraId, price: extraPrice, type: extraType } = extra;
        const _hours = safeDigit(extra.hours);
        data.extraDays += 1;
        data.extraHours += _hours;
        let _extraPrice;
        if (isNaN(extraPrice) || extraPrice === null) {
          const _price = config[`${extraType}_extra_price`];
          await this.app.mysql.update('work_data_extra', {id: extraId, price: safeDigit(_price)});
          _extraPrice = _price;
        } else {
          _extraPrice = extraPrice;
        }
        data.extraSallary += safeDigit(_extraPrice) * _hours;

        switch (extraType) {
          case 'weekday':
            data.weekdayExtraHours += _hours;
            break;
          case 'weekend':
            data.weekendExtraHours += _hours;
            break;
          case 'holiday':
            data.holidayExtraHours += _hours;
            break;
          default:
            break;
        }
      }

      // 计算计件信息
      if (!pieceSettings) {
        pieceSettings = await this.app.mysql.select('work_setting_piece', {where: {user_id: userId}});
      }
      const pieceData = await this.app.mysql.select('work_data_piece', {where: {work_data_id: id}})
      const pieceDataMap = pieceData.reduce((m, item) => {
        m[item.count_setting_id] = item;
        return m;
      }, {});
      for (let i = 0; i < pieceSettings.length; i++) {
        const d = {...pieceSettings[i]};
        d.total = d.total || 0;
        if (pieceDataMap[d.id]) {
          const _dayPieceInfo = pieceDataMap[d.id];
          const _count  = safeDigit(_dayPieceInfo.count);
          const _sallary = safeDigit(_dayPieceInfo.price) * safeDigit(_dayPieceInfo.count);
          d.totalCount += _count
          data.totalPieces += _count;
          d.totalPiece += _sallary;
          data.pieceSallary += _sallary;
        }
      }
    }
    // 汇总
    switch (calc_method) {
      case 'primary_with_extra':
        data.primarySallary = safeDigit(base_month_sallary) * durationMonths;
        data.primaryAccurate = false;
        break;
      case 'hour_with_extra':
        data.primaryAccurate = true;
    }

    data.totalHours = data.primaryHours + data.extraHours;
    data.nightSallary = Number(safeDigit(per_night_extra) * data.nightDays).toFixed(2);

    let totalSallary = safeDigit(data.nightSallary) + safeDigit(data.primarySallary);

    if (calc_method && calc_method.includes('with_extra')) {
      totalSallary += safeDigit(data.extraSallary);
    }

    // 计件
    if (calc_method === 'by_count') {
      totalSallary += safeDigit(data.pieceSallary);
    }
    data.extraSallary = Number(data.extraSallary).toFixed(2);
    data.pieceSallary = Number(data.pieceSallary).toFixed(2);
    data.totalSallary = Number(totalSallary).toFixed(2);
    return data;

  }

  async getWorkDataByDay(userId, date) {
    if (!date) {
      date = moment().format('YYYY-MM-DD');
    } else {
      date = moment(date).format('YYYY-MM-DD');
    }
    const data = await this.app.mysql.get('work_data', {user_id: userId, date});
    const settings = await this.getSetting(userId);
    if (data) {
      if (settings.calc_method === 'by_count') {
        const pieceData = await this.app.mysql.select('work_data_piece', {where: {work_data_id: data.id}});
        data.piece_info = pieceData;
      } else {
        const extraData = await this.app.mysql.select('work_data_extra', {where: {work_data_id: data.id}});
        data.extra_info = extraData;
      }
    }
    return {
      date,
      data,
    };
  }


}

function safeDigit(num) {
  return isNaN(num) ? 0 : +num;
}