const { Controller } = require('egg');

module.exports = class UserController extends Controller {

  async list() {
    try {
      const users = await this.ctx.service.user.list();
      this.ctx.body = {
        success: true,
        data: users,
      };
    } catch (e) {
      this.ctx.body = {
        success: false,
        message: e && e.message
      };
    }
  }


}