/** 自媒体管理 */

const { Controller } = require('egg');

class SelfMediaController extends Controller {

  async create() {
    const { title, content, article_type } = this.ctx.request.body;
    await this.service.selfmedia.create({
      title, content, article_type,
    });
    this.ctx.status = 201;
  }

  async update() {
    const { id } = this.ctx.params;
    const { title, content, article_type } = this.ctx.request.body;
    await this.service.selfmedia.update(id, {
      title, content, article_type,
    });
    this.ctx.status = 204;
  }

  async list() {
    const { page = 1 } = this.ctx.query;
    const result = await this.service.selfmedia.list(page);
    this.ctx.body = result;
  }

  async getById() {
    const { id } = this.ctx.query;
    const detail = await this.service.getById(id);
    this.ctx.body = detail;
  }

}

module.exports = SelfMediaController;