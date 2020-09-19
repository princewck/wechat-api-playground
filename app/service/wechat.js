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
    const res = await this.ctx.curl(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`, {dataType: 'json'});
    cache[appid] = {
      ...res.data,
      expires_at: res.data.expires_in * 1000 + new Date(),
    };
    console.log(res);
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
  async sendTemplateMessage(accessToken, toUser, templateId, page, form_id, data, emphasisKeyword, appName) {
    const res = await this.ctx.curl(`https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${accessToken}`, {
      dataType: 'json',
      headers: {
        'content-type': 'application/json'        
      },
      method: 'post',
      data: {
        touser: toUser,
        template_id: templateId,
        page,
        form_id,
        data,
        emphasis_keyword: emphasisKeyword,
      },
    });
    console.log(res);
    const { errcode: errorcode, errmsg } = res.data;
    if (toUser == 'oG2Pc4trGJBE8xWYfW951o7_RK2k') {
      this.ctx.logger.info('debug 发送模版消息');
      this.ctx.logger.info('page', page);
      this.ctx.logger.info('appName', appName);
      this.ctx.logger.info('结果：', res.data);
    }
    if (errorcode == 0) {
      await this.app.mysql.insert('message_history', {
        to_user: toUser,
        template_id: templateId,
        page,
        form_id, 
        data,
        emphasis: emphasisKeyword,
        app: appName,
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      });      
      this.disposeFormId(form_id);
      console.log('模板消息发送成功！');
    } else if (errorcode == 40037) {
      this.disposeFormId(form_id);
      throw new Error('template_id不正确！');
    } else if (errorcode == 41028) {
      this.disposeFormId(form_id);
      throw new Error('form_id 不正确或者已经过期');
    } else if (errorcode == 41029) {
      this.disposeFormId(form_id);
      throw new Error('form_id已经被使用');
    } else if (errorcode == 41030) {
      this.disposeFormId(form_id);
      throw new Error('page 不正确');
    } else if (errorcode == 45009) {
      this.disposeFormId(form_id);
      throw new Error('超过今日调用限额');
    } else {
      this.disposeFormId(form_id);
      throw new Error(`发送模板消息失败，未知错误！[${errorcode}: ${errmsg}]`);
    }
  }

  async disposeFormId(form_id) {
    await this.app.mysql.query('update form_ids set used = 1 where form_id = ?', [form_id]);
  }

  async recordFormId(openId, formId) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const expires = moment().add(7, 'days').subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss');
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

  async getAvailableFormId(open_id) {
    const data = await this.app.mysql.query('select * from form_ids where used = 0 and open_id = ? and expires_at > NOW() order by expires_at asc limit 0, 1', [open_id]);
    return data[0] && data[0].form_id;
  }

  // 获取小程序码(新版公式助手)
  async getAcode() {
    const config = this.config.wechat.workshop_new;
    const { appid, appsecret } = config;
    const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
    // const currentUser = await this.ctx.currentUser();
    const payload = {
      // access_token: accessToken,
      // scene: `inviter=${currentUser.id}` ,
      scene: 'test=1',
      page: 'pages/home/index',
      width: 500,
      is_hyaline: true,
    };
    const result = await this.ctx.curl(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`, {
      method: 'POST',
      dataType: 'buffer',
      headers: {
        'content-type': 'application/json'        
      },
      data: payload,
    });
    return result;
  }

}