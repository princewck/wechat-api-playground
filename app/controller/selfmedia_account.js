const { Controller } = require('egg');

class SelfmediaAccounts extends Controller {

  async create() {
    const { username = '', phone_number = '', password, type } = this.ctx.request.body;
    await this.service.selfmediaAccount.create({ username, password, phone_number, type });
    this.ctx.status = 201;
  }

  async remove() {
    const { id } = this.ctx.params;
    await this.service.selfmediaAccount.remove(id);
    this.ctx.status = 204;
  }

  async update() {
    const { id } = this.ctx.params;
    const { username, password, phone_number, type } = this.ctx.request.body;
    await this.service.selfmediaAccount.update(id, { username, password, phone_number, type });
    this.ctx.status = 204;
  }

  async getById() {
    const { id } = this.ctx.params;
    const result = await this.service.selfmediaAccount.getById(id);
    this.ctx.body = result;
  }

  async list() {
    const { page = 1 } = this.ctx.query;
    const result = await this.service.selfmediaAccount.list(page);
    this.ctx.body = result;
  }

}

module.exports = SelfmediaAccounts;