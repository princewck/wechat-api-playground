const { Service } = require('egg');
const moment = require('moment');

class SallaryHistoryService extends Service {

  async find(userId, year, month) {
    const data = await this.app.mysql.get('sallary_history', { user_id: userId, year, month });
    return data;
  }

  async list(userId, year) {
    const list = await this.app.mysql.select('sallary_history', {
      where: {
        user_id: userId, 
        year,
      },
    });
    return list;
  }

  async create(userId, year, month, custom, data, comment, start, end) {
    let _data = [];
    try {
      _data = JSON.stringify(data);
    } catch (e) {
      console.error(e);
    }
    const exist = await this.find(userId, year, month);
    if (exist) {
      this.app.mysql.update('sallary_history', {
        id: exist.id,
        user_id: userId,
        year,
        month,
        custom,
        data: _data,
        comment,
        start,
        end,
        updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        created_at: exist.created_at,
      });
    } else {
      this.app.mysql.insert('sallary_history', {
        user_id: userId,
        year,
        month,
        data: _data,
        comment,
        start, 
        end,
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),        
      });
    }
  }


}

module.exports = SallaryHistoryService;