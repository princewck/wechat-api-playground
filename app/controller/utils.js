const { Controller } = require('egg');

module.exports = class UtilController extends Controller {

  async stsToken() {
    try {
      const cred = await this.service.sts.getSTSToken();
      this.ctx.body = cred;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

}