const { Controller } = require('egg');

module.exports = class WechatController extends Controller {

  async recordForm() {
    try {
      const { form_id } = this.ctx.params;
      const header = this.ctx.header;
      if (!form_id) throw new Error('invalid form_id');
      const token = await this.ctx.service.auth.verify(header['w-session']);   
      const user = await this.ctx.service.user.getByToken(token);
      await this.ctx.service.wechat.recordFormId(user.open_id, form_id);
      this.ctx.status = 201;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async sendMessage() {
    try {
      const { app, id, template, page, data = {}, emphasisKeyword='',  } = this.ctx.request.body;
      const config = this.config.wechat[app];
      if (!config) throw new Error('app missing!');
      const { appid, appsecret } = config;
      const user = await this.ctx.service.user.getById(id);
      const formId = await this.ctx.service.wechat.getAvailableFormId(user.open_id);
      if (!formId) {
        throw new Error('没有可用的form_id');
      }
      const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
      console.log('accessToken', accessToken);
      console.log(accessToken, user.open_id, template, page, formId, data, emphasisKeyword, app);
      await this.ctx.service.wechat.sendTemplateMessage(
        accessToken, user.open_id, template, page, formId, data, emphasisKeyword, app
      );
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }




}