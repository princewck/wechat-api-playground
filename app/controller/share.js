const { Controller } = require('egg');

module.exports = class UserController extends Controller {

  async create() {
    const { thread_id } = this.ctx.request.body;
    try {
      await this.ctx.service.share.create(thread_id);
      this.ctx.status = 201;
    } catch (e) {
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '创建失败',
      };
    }
  }

  async show() {
    const { id } = this.ctx.params;
    try {
      const list = await this.ctx.service.share.listByThread(id);
      this.ctx.body = list;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取数据失败'
      };
    }
  }
}