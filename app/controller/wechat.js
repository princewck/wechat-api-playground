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




}