const { Controller } = require('egg');

module.exports = class AdminController extends Controller {

  async register () {
    const { username, password } = this.ctx.request.body;
    try {
      const token = await this.ctx.service.admin.register(username, password);
      const info = await this.ctx.service.admin.getByName(username);
      this.ctx.body = {
        token,
        info: {
          username: info.name,
          id: info.id,
        }
      };
    } catch (e) {
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
        message: e.message,
      }
    }
  }

}