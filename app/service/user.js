const { Service } = require('egg');

module.exports = class UserService extends Service {


  async getByOpenid(openid) {
    return await this.app.mysql.get('user', {open_id});
  }

  async getByToken(token) {
    return await this.app.mysql.get('user', {token});
  }

  async list() {
    return await this.app.mysql.select('user', {
      columns: ['id', 'avatar', 'gender', 'province', 'city', 'nick', 'open_id', 'last_login', 'first_login'],
    });
  }

}