const { Controller } = require('egg');

module.exports = class UserController extends Controller {

  async list() {
    try {
      const { page = 1, appName } = this.ctx.query;
      const users = await this.ctx.service.user.list(page, appName);
      this.ctx.body = {
        success: true,
        data: users,
      };
    } catch (e) {
      console.error(e);
      this.ctx.body = {
        success: false,
        message: e && e.message
      };
    }
  }

  // 获取当前用户
  async find() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);
      this.ctx.body = user;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取用户信息失败！'
      };
    }
  }

  async findById() {
    try {
      const { id } = this.ctx.params;
      const user = await this.ctx.service.user.getById(id);
      this.ctx.body = user;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取用户信息失败！'
      };
    }
  }
}