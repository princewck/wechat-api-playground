/**
 * 日常提醒登录
 */
const { Subscription } = require('egg');

class DailyRemind extends Subscription {
  static get schedule() {
    return {
      type: 'worker',
      cron: '0 */2 * * * *',
    };
  }

  async subscribe () {
    try {
      await this.ctx.service.workshopMessage.dailyRemind();
    } catch (e) {
      console.error(e);
    }
  }  
}

module.exports = DailyRemind;