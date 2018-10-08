
const { Controller } = require('egg');

module.exports = class WishController extends Controller {

  async index() {
    try {
      const categories = await this.ctx.service.wish.findAllCategories();
      this.ctx.body = categories;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'error occured when getting categories'
      };
    }
  }

  async create() {
    const { name, description, status } = this.ctx.request.body;
    if (!name) {
      this.ctx.body = {
        message: '分类名不能为空'
      };
      return;
    }
    try {
      await this.ctx.service.wish.createCategory({
        name, description, status
      });
      this.ctx.status = 201;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message || '创建失败'
      };
    }
  }

  async destroy() {
    const { id } = this.ctx.params;
    if (!/\d/.test(`${id}`)) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'ID 不合法',
      };
      return
    }
    try {
      await this.ctx.service.wish.destroyCategory(id);
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }

  }

  async update() {
    const { id } = this.ctx.params;
    const { name = '', description = '', status = 1 } = this.ctx.request.body;
    if (!/\d/.test(`${id}`)) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'ID 不合法',
      };
      return;
    }
    if (!name) {
      this.ctx.status = 403;
      this.ctx.body = {message: '分类名不能为空'};
      return;
    }
    try {
      const res = await this.ctx.service.wish.updateCategory(id, {
        name, 
        description, 
        status
      });
      this.ctx.body = {
        data: res,
      };
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async show() {
    const { id } = this.ctx.params;
    if (!/\d/.test(`${id}`)) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'ID 不合法',
      };
      return;
    }    
    try {
      const category = await this.ctx.service.wish.findCategory(id);
      this.ctx.body = category;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

}