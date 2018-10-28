const { Service } = require('egg');
const moment = require('moment');

// 打卡提醒
const templateId = 'kZE1seYo0SlPMOcsGhepsGbvlsKpn4bi-7NxTQQuuQ0';

module.exports = class WorkshopMessageService extends Service {

  async dailyRemind() {
    this.ctx.logger.info('-----每日登录提醒:开始发送-----');
    const users = await this.app.mysql.select('daily_remind_list', {
      limit: 10, 
      offset: 0,
      orders: [['last_login', 'asc']],
    });
    const config = this.config.wechat.workshop;
    const { appid, appsecret } = config;
    const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const templateData = {
        keyword1: {value: '工时助手记录提醒'},
        keyword2: {value: moment().format('YYYY-MM-DD HH:mm')},
        keyword3: {value: '您已经离开24小时啦，是时候记录一下工时和加班信息啦！'},
        keyword4: {value: '上班辛苦啦！'}
      };   
      this.ctx.logger.info(`-----每日登录提醒:第${i + 1}条`);
      const formId = await this.ctx.service.wechat.getAvailableFormId(user.open_id);
      this.ctx.logger.info(`-----每日登录提醒:formId: ${formId}`);
      await this.ctx.service.wechat.sendTemplateMessage(
        accessToken, user.open_id, templateId, '/pages/home', 
        formId, 
        templateData, 
        'keyword4.DATA', 
        'workshop',
      );
      this.ctx.logger.info(`-----每日登录提醒:${formId}发送成功！`);
    }
    this.ctx.logger.info(`-----每日登录提醒:本次任务结束！`);
  }


}