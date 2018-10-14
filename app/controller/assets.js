const { Controller } = require('egg');

module.exports = class AssetsController extends Controller {


  async index() {
    const { type } = this.ctx.request.query;
    let result;
    try {
      if (type) {
        result = await this.service.assets.listByType(type);
      } else {
        result = await this.service.assets.listAll();
      }
      this.ctx.body = result;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.message = {
        message: e.message,
      }
    }
  }

  async show() {
    const { id } = this.ctx.params;
    if (!id) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'id不合法',
      };
      return;
    }
    try {
      const data = await this.ctx.service.assets.findById(id);
      this.ctx.body = data;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }


  async create() {
    const { name, description, value, type } = this.ctx.request.body;
    try {
      this.ctx.service.assets.create({
        name, 
        description,
        type,
        value,
      });
      this.ctx.status = 201;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async update() {
    const { id } = this.ctx.params;
    const { name, description, type } = this.ctx.request.body;
    try {
      await this.ctx.service.assets.update(id, {name, description, type});
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async destroy() {
    const { id } = this.ctx.params;
    try {
      await this.service.assets.destroy(id);
      this.ctx.status = 204;
    }
    catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

}