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

  async task (ctx) {
    try {
      await ctx.service.workshopMessage.dailyRemind();
    } catch (e) {
      console.error(e);
    }
  }  
}

module.exports = DailyRemind;