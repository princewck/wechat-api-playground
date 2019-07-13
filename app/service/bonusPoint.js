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
    await this.app.mysql.query('update user set bp = bp + 2 where id = ?', [user.id]);
  }

  async checkAvailableBP() {
    const user = await this.ctx.currentUser();
    if (!user) {
      this.logger.error('查询用户可用积分：用户不合法')
      throw new Error('非法的请求');
    }
    return user.bp || 0;
  }

  // 登记邀请记录，发放邀请奖励
  async inviteAward(inviterId) {
    const inviter = await this.app.mysql.get('user', {id: inviterId});
    if (!inviter) {
      throw new Error('invalid inviter');
    }
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');    
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const invitedUser = await this.ctx.currentUser();
    // 今天已经邀请了多少个？
    const sql = 'select count(id) from bonuspoint where user_id = ? and created_at between ? and ?';
    const invitedCount = await this.app.mysql.query(sql, [inviterId, dstart, dend]);
    if (invitedCount >= 5) {
      throw new Error('每天最多邀请4个好友，明天再来哟！');
    }
    await this.app.mysql.insert('bonuspoint', { amount: 10, user_id: inviterId, type: 'get', action: 'invite', created_at: now, updated_at: now, invited_user_id: invitedUser.id });
    await this.app.mysql.query('update user set bp = bp + 10 where id = ?', [ inviterId ]);
    return {
      inviter: inviter.name,
      award: 10,
    };
  }

  // 每日邀请记录
  async dailyInviteList(inviterId) {
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'); 
    const sql = 'select * from bonuspoint where user_id = ? and created_at between ? and ?';
    const list = await this.app.mysql.query(sql, [inviterId, dstart, dend]);
    return list;
  }


  // 添加到小程序奖励
  async addMiniAward() {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const user = await this.ctx.currentUser();
    const exist = await this.app.mysql.get('user', { action: 'add_my_mini', user_id: user.id });
    if (exist) {
      throw new Error('已经领取过该奖励，不能重复领取！');
    }
    await this.app.mysql.insert('bonuspoint', { amount: 20, user_id: user.id, type: 'get', action: 'add_my_mini', created_at: now, updated_at: now });
    await this.app.mysql.query('update user set bp = bp + 20 where id = ?', [ user.id ]);
    return {
      award: 20,
    };
  }

  // 是否添加到我的小程序
  async addMiniState() {
    const user = await this.ctx.currentUser();
    const exist = await this.app.mysql.get('user', { action: 'add_my_mini', user_id: user.id });
    if (exist) return true;
    return false;
  }

  async loginDays() {
    const user = await this.ctx.currentUser();
    const days = await this.app.mysql.count('bonuspoint', {
      user_id: user.id,
      action: 'login',
    });
    return days || 0;
  }

  async getLoginDays(userId) {
    const days = await this.app.mysql.count('bonuspoint', {
      user_id: userId,
      action: 'login',
    });
    return days || 0;    
  }

}

module.exports = BonusPointService;