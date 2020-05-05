const { Service } = require('egg');
const moment = require('moment');
const constants = require('../constants');

const { SETTING_BY_ID, DATA_BY_DAY, CALC_INFO, DATA_BY_DURATION } = constants.WORK;

module.exports = class WorshopManageService extends Service {

  // 获取设置
  async getSetting(userId) {
    const setting = await this.app.mysql.get('work_setting', { user_id: userId });
    if (!setting) {
      this.config.logger.info(`[getSetting]: ${userId}的配置不存在, 创建一份默认的`);
      await this.createDefaultSetting(userId);
      return await this.getSetting(userId);
    }
    const redis = this.app.getRedisClient();
    const key = `${userId}:${SETTING_BY_ID}`;
    const cache = await redis.get(key);
    if (cache) {
      return cache;
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
    const result = {
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
    await redis.set(key, result);
    return result;
  }

  async updateSetting(userId, data) {
    const redis = this.app.getRedisClient();
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
      await this.flushAllByPrefix(userId);
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
      per_hour_sallary: 10,
      base_month_sallary: 1000,
      month_start: 1,
      weekday_extra_price: 20,
      weekend_extra_price: 10,
      holiday_extra_price: 10,
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

  // 更新某天的数据
  async update(userId, date, data) {
    const fmtDate = moment(date).format('YYYY-MM-DD');
    let record = await this.app.mysql.get('work_data', {date: fmtDate, user_id: userId});
    const redis = this.app.getRedisClient();
    const key = `${userId}:${DATA_BY_DAY}:${fmtDate}`;
    await this.flushAllByPrefix(userId);
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
      ...(primary_hours !== undefined ? {primary_hours} : {}),
      ...(primary_price !== undefined ? { primary_price } : {}),
      ...(absent ? {absent}: {}),
      ...(duty_type ? {duty_type} : {}),
      ...(comment ? { comment } : {}),
    };
    const settings = await this.getSetting(userId);
    if (record && record.id) {
      await this.app.mysql.update('work_data', {id: record.id, ...payload}, );
    } else {
      await this.app.mysql.insert('work_data', payload);
      record = await this.app.mysql.get('work_data', {user_id: userId, date: fmtDate});
    }
    if (extras && Array.isArray(extras) && usingExtre(settings)) {
      const extra = extras[0];
      const extraPayload = {
        work_data_id: record.id,
        type: extra.type,
        price: extra.price,
        hours: extra.hours,
      };
      const exist = await this.app.mysql.get('work_data_extra', {work_data_id: record.id});
      if (exist) {
        if (extraPayload.hours > 0) {
          await this.app.mysql.update('work_data_extra', {
            id: exist.id, 
            ...extraPayload,
          })
        } else {
          await this.app.mysql.delete('work_data_extra', { id: exist.id });
        }
      } else if (extraPayload.hours) {
        await this.app.mysql.insert('work_data_extra', extraPayload);
      }
    }

    if (piece_info && Array.isArray(piece_info) && usingPiece(settings)) {
      const conn = await this.app.mysql.beginTransaction();
      try {
        await conn.delete('work_data_piece', {
          work_data_id: record.id,
        });
        const rows = piece_info.map(info => {
          return {
            count_setting_id: info.setting_id,
            count: info.count,
            price: info.price,
            work_data_id: record.id,
          };
        });
        if (rows.length) {
          await conn.insert('work_data_piece', rows);
          await conn.commit();
        }
      } catch (e) {
        console.error(e);
        await conn.rollback();
      }
    }
    await redis.del(key);
  }

  async getWorkData(userId, start, end) {
    if (!start) {
      start = moment().startOf('month').format('YYYY-MM-DD');
    }
    if (!end) {
      end = moment().endOf('month').format('YYYY-MM-DD');
    }

    const cacheKey = `${userId}:${DATA_BY_DURATION}:${start}:${end}${isSingleMonth(start, end) ? ':monthly' : ''}`;
    const redis = this.app.getRedisClient();
    const cache = await redis.get(cacheKey);
    if (cache) {
      return cache;
    }

    const setting = await this.getSetting(userId);
    const pieceSettings = setting.piece_info || [];
    const pieceSettingMap = pieceSettings.reduce((m, item) => {
      m[item.id] = item.name;
      return m;
    }, {});
    const workDataList = await this.app.mysql.query(`
    select * from work_data where user_id = ? and \`date\` >= ? and \`date\` <= ?
    `, [userId, start, end]);
    for (let i = 0; i < workDataList.length; i ++) {
      try {
        const item = workDataList[i];
        let extras = [];
        let pieceInfo = [];
        let pieceCount = 0;
        let pieceSallary = 0;
        if (setting.calc_method === 'by_count') {
          pieceInfo = await this.app.mysql.select('work_data_piece', {where: {work_data_id: item.id}});
          pieceInfo.forEach(item2 => {
            item2.name = pieceSettingMap[item2.count_setting_id];
            item2.total = +Number((item2.price || 0) * (item2.count || 0)).toFixed(2);
            pieceCount += +item2.count || 0;
            pieceSallary += item2.total;
          })
        }
        if (setting.calc_method && setting.calc_method.includes('extra')) {
          extras = await this.app.mysql.select('work_data_extra', {where: {work_data_id: item.id}});
        }
        item.extras = extras;
        item.piece_info = pieceInfo;    
        item.piece_count = pieceCount;
        item.piece_sallary = pieceSallary;    
      } catch (e) {
        this.logger.error(e);
        console.error(e);
      }
    }
    const result = workDataList.reduce((map, item) => {
      map[moment(item.date).format('YYYY-MM-DD')] = item;
      return map;
    }, {});
    await redis.set(cacheKey, result);
    return result;
  }

  // 获取一段时间内的工资计算结果
  async getCalcInfo(userId, start, end, customCalcMethod = '') {
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
    let config = await this.getSetting(userId);
    const pieceInfo = [];
    const pieceInfoAggreageMap = {};
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
      if (month_start === 1) {
        end = start.clone().endOf('month').format('YYYY-MM-DD');
      }
    }
    const key = `${userId}:${CALC_INFO}:${start}:${end}${customCalcMethod}`;
    const redis = this.app.getRedisClient();
    const cache = await redis.get(key);
    if (cache) {
      return cache;
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
        data.primarySallary = safeDigit(data.primarySallary + primary_hours * data.primaryPrice);
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
        const _pieceData = pieceDataMap[d.id];
        if (_pieceData) {
          // 这里的price是不准的，只看汇总的结果
          const _info = {
            ..._pieceData,
            name: d.name,
            total: +Number(_pieceData.count * _pieceData.price).toFixed(2)
          };
          if (!pieceInfoAggreageMap[d.id]) {
            pieceInfoAggreageMap[d.id] = _info;
            pieceInfo.push(_info);
          } else {
            const _info2 = pieceInfoAggreageMap[d.id];
            _info2.count += _pieceData.count;
            _info2.total += +Number(_pieceData.count * _pieceData.price).toFixed(2);
          }
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
    data.pieceInfo = pieceInfo;
    const calcMethod = customCalcMethod || calc_method;
    // 汇总
    switch (calcMethod) {
      case 'primary_with_extra':
        data.primarySallary = safeDigit(base_month_sallary * durationMonths);
        data.primaryAccurate = false;
        break;
      case 'hour_with_extra':
        data.primaryAccurate = true;
    }

    data.totalHours = data.primaryHours + data.extraHours;
    data.nightSallary = Number(safeDigit(per_night_extra) * data.nightDays).toFixed(2);

    let totalSallary = safeDigit(data.nightSallary) + safeDigit(data.primarySallary);

    if (calcMethod && calcMethod.includes('with_extra')) {
      totalSallary += safeDigit(data.extraSallary);
    }

    // 计件
    if (calcMethod === 'by_count') {
      totalSallary += safeDigit(data.pieceSallary);
    }
    data.extraSallary = Number(data.extraSallary).toFixed(2);
    data.pieceSallary = Number(data.pieceSallary).toFixed(2);
    data.totalSallary = Number(totalSallary).toFixed(2);
    await redis.set(key, data);
    return data;
  }

  async getWorkDataByDay(userId, date) {
    if (!date) {
      date = moment().format('YYYY-MM-DD');
    } else {
      date = moment(new Date(date)).format('YYYY-MM-DD');
    }
    const redis = this.app.getRedisClient();
    const key = `${userId}:${DATA_BY_DAY}:${date}`;
    const cache = await redis.get(key);
    if (cache) {
      return cache;
    }
    const data = await this.app.mysql.get('work_data', {user_id: userId, date});
    const settings = await this.getSetting(userId);
    if (data) {
      if (settings.calc_method === 'by_count') {
        const sql = 'select wdp.*, wsp.name from work_data_piece as wdp left join work_setting_piece as wsp on wsp.id = wdp.count_setting_id where wdp.work_data_id = ?';        
        const pieceData = await this.app.mysql.query(sql, [data.id]);
        data.piece_info = pieceData;
      } else {
        const extraData = await this.app.mysql.select('work_data_extra', {where: {work_data_id: data.id}});
        data.extra_info = extraData;
      }
    }
    const result = {
      date,
      data,
    };
    await redis.set(key, result);
    return result;
  }

  async flushMonthlyStatisticsCache(userId, date) {
    const start = moment(date).startOf('month').format('YYYY-MM-DD');
    const end = moment(date).endOf('month').format('YYYY-MM-DD');
    const methods = [constants.METHODS.BY_EXTRA, constants.METHODS.BY_HOUR, constants.METHODS.BY_COUNT];
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const statisticsKey = `${userId}:${CALC_INFO}:${start}:${end}${method}`;
      const redis = this.app.getRedisClient();   
      await redis.del(statisticsKey);
    }
  }

  async flushMonthlyWorkData(userId, date) {
    const start = moment(date).startOf('month').format('YYYY-MM-DD');
    const end = moment(date).endOf('month').format('YYYY-MM-DD');
    const key = `${userId}:${DATA_BY_DURATION}:${start}:${end}:monthly`;
    const redis = this.app.getRedisClient();
    await redis.del(key);
  }
  async flushAllByPrefix(prefix) {
    const redis = this.app.getRedisClient();
    const keys = await redis.keys(`${prefix}*`);
    for (let i = 0; i < keys.length; i++) {
      await redis.del(keys[i].replace('wechat_api_playgroud:', ''));
    }
  }
}

function safeDigit(num) {
  return isNaN(num) ? 0 : +Number(num).toFixed(2);
}

/** 使用计件的方式 */
function usingPiece(settings) {
  return settings && settings.calc_method === 'by_count';
}

function usingExtre(settings) {
  return settings && settings.calc_method.includes('with_extra');
}

function isSingleMonth(start, end) {
  const s = moment().startOf('month').format('YYYY-MM-DD');
  const e = moment().endOf('month').format('YYYY-MM-DD');
  return start === s && end === e;
}