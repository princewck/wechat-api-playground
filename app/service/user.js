const { Service } = require('egg');

module.exports = class UserService extends Service {


  async getByOpenid(openid) {
    return await this.app.mysql.get('user', { open_id });
  }

  async getByToken(token) {
    return await this.app.mysql.get('user', { token });
  }

  async getById(id) {
    return await this.app.mysql.get('user', { id });
  }

  async list(page, app) {
    const tableName = 'user';
    const conditions = {
      app_name: app,
    }
    const columns = ['id', 'avatar', 'gender', 'province', 'city', 'nick', 'last_login', 'first_login', 'app_name'];
    const count = await this.app.mysql.count(tableName, conditions);
    const list = await this.app.mysql.select('user', {
      where: { ...conditions },
      columns,
      limit: 10,
      offset: (page - 1) * 10,
      orders: [['last_login', 'desc']]
    });
    return {
      current: +page,
      total_pages: Math.ceil(count / 10),
      count,
      list,
    }
  }
}