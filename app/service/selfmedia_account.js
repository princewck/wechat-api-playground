const { Service } = require('egg');
const moment = require('moment');

class SelfmediaAccounts extends Service {

  async create(data) {
    const { username, phone_number, password, type } = data;
    await this.app.mysql.insert('selfmedia_accounts', {
      username,
      phone_number,
      password,
      type,
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  async remove(id) {
    await this.app.mysql.delete('selfmedia_accounts', { id });
  }

  async update(id, data) {
    await this.app.mysql.update('selfmedia_accounts', {
      id, 
      ...data,
    });
  }

  async getById(id) {
    return await this.app.mysql.get({ id });
  }

  async list(page = 1) {
    const result = await this.app.mysql.select('selfmedia_accounts', {
      offset: (page - 1) * 20,
      limit: 20,      
    });
    const total = await this.app.mysql.count('selfmedia_accounts', {});
    return {
      accounts: result,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / 20),
        total_count: total,
      }
    }
  }


}

module.exports = SelfmediaAccounts;