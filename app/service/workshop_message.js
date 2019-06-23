const { Service } = require('egg');
const moment = require('moment');

// 打卡提醒
const templateId = 'kZE1seYo0SlPMOcsGhepsGbvlsKpn4bi-7NxTQQuuQ0';
const templateIdNew = 'piWM_uDgU8MUVj3amvZr3vsxJRuUhOCt8qY3t2YYMWA';

module.exports = class WorkshopMessageService extends Service {

  /** 旧版 */
  async dailyRemind() {
    this.ctx.logger.info('-----每日登录提醒:开始发送-----');
    const users = await this.app.mysql.select('daily_remind_list', {
      where: {
        app_name: 'workshop',
      },
      limit: 50, 
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
      try {
        await this.ctx.service.wechat.sendTemplateMessage(
          accessToken, user.open_id, templateId, 'pages/home', 
          formId, 
          templateData, 
          'keyword4.DATA', 
          'workshop',
        );
      } catch (e) {
        this.ctx.logger.error(e);
      }
      this.ctx.logger.info(`-----每日登录提醒:${formId}发送成功！`);
    }
    this.ctx.logger.info(`-----每日登录提醒:本次任务结束！`);
  }


  async dailyRemindNew() {
    this.ctx.logger.info('-----新版工时记录：每日登录提醒:开始发送-----');
    const users = await this.app.mysql.select('daily_remind_list', {
      where: {
        app_name: 'workshop_new',
      },
      limit: 50, 
      offset: 0,
      orders: [['last_login', 'asc']],
    });
    const config = this.config.wechat.workshop_new;
    const { appid, appsecret } = config;
    const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const { last_login, first_login } = user;
      const lastLogin = moment(last_login || first_login).format('MM月DD HH:mm');
      const monthWorkInfo = await this.ctx.service.workshopManage.getCalcInfo(user.id);
      const totalDatys = await this.ctx.service.bonusPoint.getLoginDays(user.id);
      const templateData = {
        keyword1: {value: `${user.nick || '我'}的工时记录`},
        keyword2: {value: lastLogin},
        keyword3: {value: `${totalDatys}天`},
        keyword4: {value: '主人，好习惯是在习惯中养成的，该记录今天的工时了呢，顺便签到领个积分咩～'},
        keyword5: {value: `${monthWorkInfo.totalSallary}元`}
      };   
      this.ctx.logger.info(`-----每日登录提醒:第${i + 1}条`);
      const formId = await this.ctx.service.wechat.getAvailableFormId(user.open_id);
      this.ctx.logger.info(`-----每日登录提醒:formId: ${formId}`);
      try {
        await this.ctx.service.wechat.sendTemplateMessage(
          accessToken, user.open_id, templateIdNew, 'pages/home/index', 
          formId, 
          templateData, 
          'keyword5.DATA', 
          'workshop_new',
        );
      } catch (e) {
        this.ctx.logger.error(e);
      }
      this.ctx.logger.info(`-----每日登录提醒:${formId}发送成功！`);
    }
    this.ctx.logger.info(`-----每日登录提醒:本次任务结束！`);
  }

}