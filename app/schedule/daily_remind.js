/**
 * 日常提醒登录
 */
const { Subscription } = require('egg');

/**
 * 工作日晚上8-11点，每5分钟尝试给20个用户发送提醒
 * 能处理720个用户，后面根据用总户量再做调整
 */ 
class DailyRemind extends Subscription {
  static get schedule() {
    return {
      type: 'worker',
      cron: '0 */10 * * * 1-6',
      env: ['prod']
    };
  }

  async subscribe () {
    try {
      await this.ctx.service.workshopMessage.dailyRemind();
    } catch (e) {
      this.ctx.logger.error(e);
    }
  }  
}

module.exports = DailyRemind;