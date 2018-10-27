const { Service } = require('egg');
const moment = require('moment');

// 打卡提醒
const templateId = 'kZE1seYo0SlPMOcsGhepsGbvlsKpn4bi-7NxTQQuuQ0';

module.exports = class WorkshopMessageService extends Service {

  async dailyRemind() {
    const users = await this.app.mysql.select('daily_remind_list', {
      limit: 10, 
      offset: 0,
      orders: [['last_login', 'asc']],
    });
    const config = this.config.wechat.workshop;
    const { appid, appsecret } = config;
    const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
    for (let i = 0; i < users.length; i++) {
      const templateData = {
        keyword1: {value: '工时助手记录提醒'},
        keyword2: {value: moment().format('YYYY-MM-DD HH:mm')},
        keyword3: {value: '您已经离开24小时啦，是时候记录一下工时和加班信息啦！'},
        keyword4: {value: '上班辛苦啦！'}
      };      
      const formId = await this.ctx.service.wechat.getAvailableFormId(user.open_id);
      await this.ctx.service.wechat.sendTemplateMessage(
        accessToken, user.open_id, templateId, '/pages/home', 
        formId, 
        templateData, 
        emphasisKeyword, 
        'workshop',
      );
    }
    return users;
  }


}