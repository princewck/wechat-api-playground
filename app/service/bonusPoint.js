const { Service } = require('egg');
const moment = require('moment');

class BonusPointService extends Service {

  // 登陆奖励，一天一次
  async loginAward() {
    const user = await this.ctx.currentUser();
    if (!user) {
      this.logger.error('领取登陆奖励：用户不合法')
      throw new Error('非法的请求');
    }
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const start = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const exist = await this.app.mysql.query(`select amount from bonuspoint where user_id = ? and created_at between ? and ?`,[user.id, start, end]);
    if (exist && exist[0] && exist[0].amount > 0) {
      throw new Error('登陆奖励一天只能领取一次');
    }
    await this.app.mysql.insert('bonuspoint', { amount: 2, user_id: user.id, type: 'get', action: 'login', created_at: now, updated_at: now });
    await this.app.mysql.query('update user set bp = bp + 2 where id = user.id');
  }

  async checkAvailableBP() {
    const user = await this.ctx.currentUser();
    if (!user) {
      this.logger.error('查询用户可用积分：用户不合法')
      throw new Error('非法的请求');
    }
    return user.bp || 0;
  }

  async loginDays() {
    const user = await this.ctx.currentUser();
    const sql = 'select count(id) from bonuspoint where user_id = ? and action = \'login\'';
    const days = await this.app.mysql.count('bonuspoint', {
      user_id: user.id,
      action: 'login',
    });
    return days || 0;
  }

}

module.exports = BonusPointService;