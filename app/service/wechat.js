const { Service } = require('egg');
const moment = require('moment');

const cache = {

}; //

module.exports = class WechatService extends Service {

  async getAccessToken(appid, appsecret) {
    const _cache = cache[appid];
    const now = +new Date();
    if (_cache && now < cache.expires_at) {
      return _cache.access_token;
    }
    const res = await this.ctx.curl(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`);
    cache[appid] = {
      ...res.data,
      expires_at: res.data.expires_in * 1000 + new Date(),
    };
    return res.data.access_token;
  }

  /**
   * 
   * @param {*} accessToken 
   * @param {*} toUser 
   * @param {*} templateId 
   * @param {*} page 
   * @param {*} form_id 
   * @param {*} data 
   * @param {*} emphasisKeyword 
   * @param {*} appName 区分小程序 e.g  wish | workshop
   */
  async senTemplateMessage(accessToken, toUser, templateId, page, form_id, data, emphasisKeyword, appName) {
    const res = await this.ctx.curl(`https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${accessToken}`, {
      dataType: 'json',
      method: 'post',
    });
    console.log(res);
    const { errcode: errorcode } = res.data;
    if (errorcode == 0) {
      await this.app.mysql.insert('message_history', {
        to_user: toUser,
        template_id: templateId,
        page,
        form_id, 
        data,
        emphasis: emphasisKeyword,
        app: appName,
      });
    } else if (errorcode == 40037) {
      throw new Error('template_id不正确！');
    } else if (errorcode == 41028) {
      throw new Error('form_id 不正确或者已经过期');
    } else if (errorcode == 41029) {
      throw new Error('form_id已经被使用');
    } else if (errorcode == 41030) {
      throw new Error('page 不正确');
    } else if (errorcode == 45009) {
      throw new Error('超过今日调用限额');
    } else {
      throw new Error(`发送模板消息失败，未知错误！[${errorcode}]`);
    }
  }

  async recordFormId(openId, formId) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const expires = now.add(7, 'days').subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    await this.app.mysql.insert('form_ids', {
      open_id: openId,
      form_id: formId,
      created_at: now,
      expires_at: expires,
      used: 0,
    });
  }

  async useForm(id) {
    await this.app.mysql.query('update form_ids set used = 1 where id = ?', [id]);
  }


}