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

  // 登陆奖励，一天一次
  async adsAward() {
    const user = await this.ctx.currentUser();
    if (!user) {
      this.logger.error('领取登陆奖励：用户不合法')
      throw new Error('非法的请求');
    }
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const start = moment().startOf('day');
    const end = moment().endOf('day');
    const { c: existCount } = await this.app.mysql.query('select count(id) as c from bonuspoint where user_id = ? and `action` = \'ads\' and  created_at between ? and ? ', [user.id, start, end]);
    const delta = existCount > 5 ? 3 : 8;
    const amount = 2 + Math.ceil(Math.random() * delta);
    await this.app.mysql.insert('bonuspoint', { amount, user_id: user.id, type: 'get', action: 'ads', created_at: now, updated_at: now });
    await this.app.mysql.query(`update user set bp = bp + ${ amount } where id = ?`, [user.id]);
    await this.ctx.service.workshopMessage.adsAwardMessage(amount);
    return amount;
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
    const invitedUser = await this.ctx.currentUser();
    if (!inviter) {
      console.error('invalid inviter');
      throw new Error('错误的请求');
    }
    const firstLogin = moment(new Date(+invitedUser.first_login));
    const current = moment();
    if (current.subtract(2, 'minutes').isAfter(firstLogin)) {
      throw new Error('您不是新用户！');
    }
    if (invitedUser.inviter) {
      this.ctx.logger.info('already invited by another user', invitedUser.id);
      throw new Error('您已经被其他用户邀请过了。');
    }
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');    
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    // 今天已经邀请了多少个？
    const sql = 'select count(id) from bonuspoint where user_id = ? and created_at between ? and ?';
    const invitedCount = await this.app.mysql.query(sql, [inviterId, dstart, dend]);
    if (invitedCount >= 5) {
      this.ctx.logger.info('每天最多邀请5个好友，邀请无效');
      throw new Error('每天最多邀请5个好友，邀请无效');
    }
    await this.app.mysql.insert('bonuspoint', { amount: 15, user_id: inviterId, type: 'get', action: 'invite', created_at: now, updated_at: now, invited_user_id: invitedUser.id });
    await this.app.mysql.query('update user set bp = bp + 10 where id = ?', [ inviterId ]);
    await this.app.mysql.query('update user set inviter = ? where id = ?', [inviterId, invitedUser.id]);
    return {
      inviter: inviter.name,
      award: 10,
    };
  }

  // 每日邀请记录
  async dailyInviteList(inviterId) {
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'); 
    const sql = `
      select bp.*, u.nick, u.avatar from bonuspoint as bp
      left join user as u on u.id = bp.invited_user_id
      where bp.user_id = ? and action='invite' and created_at between ? and ?
    `;
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

  // 获取最近50条积分记录
  async getRecentList(userId) {
    const sql = 'select * from bonuspoint where user_id = ? order by created_at DESC limit 0, 50';
    const result = await this.app.mysql.query(sql, [userId]);
    return result;
  }

}

module.exports = BonusPointService;