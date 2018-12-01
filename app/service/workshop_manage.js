const { Service } = require('egg');
const moment = require('moment');

module.exports = class WorshopManageService extends Service {


// 向前兼容数据
async syncStorageData(userId, data) {
  let countSetting = null;
  for (key in data) {
    const d = moment(key);
    const valid = d.isValid();
    const date = d.format('YYYY-MM-DD');
    const old = await this.app.mysql.get('work_data',{date});
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

      const record = await this.app.mysql.get('work_data', {date});
      // 获取刚才插入的id
      const workDataId = record.id;

      // 同步加班信息
      let extras = data.extras;
      if (!(extras instanceof Array)) {
        extras = [];
      }

      for (let i = 0; i < extras.length; i ++ ) {
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
  await this.app.mysql.insert('work_setting', setting);
  await this.app.mysql.insert('work_setting_piece', pieceSetting);
}


// 获取设置
async getSetting(userId) {
  const setting = await this.app.mysql.get('work_setting', {user_id: userId});
  if (!setting) {
    return null;
  }
  const pieceSetting = await this.app.mysql.select('work_setting_piece', {where: {user_id: userId}});
  const {
    calc_method,
    weekday_extra_price = 0,
    weekend_extra_price = 0,
    holiday_extra_price = 0,
    per_night_extra = 0,
    base_month_sallary = 0,
    per_hour_sallary = 0,
    month_start = 1,
  }
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

}



}

function safeDigit(num) {
  return isNaN(num) ? 0 : +num;
}