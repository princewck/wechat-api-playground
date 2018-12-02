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
    let countSetting = null;
    for (key in data) {
      const d = moment(key);
      const valid = d.isValid();
      const date = d.format('YYYY-MM-DD');
      const old = await this.app.mysql.get('work_data', { date });
      if (old) continue;
      console.log('data in ', date, ' already exist, skipping...');
      // 同步基本信息
      if (valid) {
        const primaryPayload = {
          date,
          primary_hours: safeDigit(data.primary),
          primary_price: safeDigit(data.primaryPrice),
          absent: 0,
          duty_type: data.night ? 'night' : null,
          comment: '',
          user_id: userId,
        };

        const result = await this.app.mysql.insert('work_data', primaryPayload);
        if (result.affectedRows === 1) {
          throw new Error(date, ':同步work_data失败');
        }

        const record = await this.app.mysql.get('work_data', { date });
        // 获取刚才插入的id
        const workDataId = record.id;

        // 同步加班信息
        let extras = data.extras;
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
        if (data.count > 0) {
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
          this.app.mysql.insert('work_setting_piece', piecePayload);
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
    const pieceSetting = await this.app.mysql.select('work_setting_piece', { where: { user_id: userId } });
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
      calcMethod: calc_method,
      extraCategories: {
        weekday: weekday_extra_price,
        weekend: weekend_extra_price,
        holiday: holiday_extra_price,
      },
      others: {
        night: per_night_extra,
      },
      baseSallary: base_month_sallary,
      sallaryPerHour: per_hour_sallary,
      monthStart: month_start,
      pieceSetting: pieceSetting,
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
      piece_info,
    } = data;
    const record = await this.app.mysql.get({ user_id: userId });
    const conn = this.app.mysql.beginTransaction();
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
          await this.app.mysql.insert('work_setting_piece', payload);
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

  // 获取一段时间的数据
  async getData(userId, start, end) {
    const settings = await this.app.mysql.select('work_data', {
      where: {
        date: {
          $between: [start, end],
        },
        user_id: userId,
      }
    });
    for (let i = 0; i < settings.length; i++) {
      const calcMethod = setting.calc_method || '';
      if (calcMethod.includes('extra')) {
        const setting = settings[i];
        const extra = await this.app.mysql.get('work_data_extra', {
          work_data_id: setting.id
        });
        settings[i].extras = [extra];
      }
      if (calcMethod === 'by_count') {
        const pieceInfo = await this.app.mysql.select('work_data_piece', {
          where: {
            work_data_id: setting.id
          }
        });
        settings[i].piece_info = pieceInfo;
      }
    }
    return settings;
  }

  // 更新某天的数据
  async update(userId, date, data) {
    let record = await this.app.mysql.get('work_data', {date});
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
      date,
      user_id: userId,
      ...(primary_hours ? {primary_hours} : {}),
      ...(primary_price ? { primary_price } : {}),
      ...(absent ? {absent}: {}),
      ...(duty_type ? {duty_type} : {}),
      ...(comment ? { comment } : {}),
    };
    if (record && record.id) {
      await this.app.mysql.update('wwork_data', {id: record.id, ...payload});
    } else {
      await this.app.mysql.insert('work_data', payload);
      record = await this.app.mysql.get('work_data', {user_id: userId, date});
    }
    if (extras && extras.length) {
      const extra = extras[0];
      const extraPayload = {
        ...(extra.id ? {id: extra.id} : {}),
        work_data_id: record.id,
        type: extra.type,
        price: extra.price,
        hours: extra.hours,
      };
      await this.app.mysql.insert('work_data_extra', extraPayload);
    }

    if (piece_info && piece_info.length) {
      rows = piece_info.map(info => {
        return {
          count_setting_id: info.setting_id,
          count: info.count,
          price: info.price,
          work_data_id: record.id,
        };
      });
      await this.app.mysql.insert('work_data_piece', rows);
    }

  }

}

function safeDigit(num) {
  return isNaN(num) ? 0 : +num;
}