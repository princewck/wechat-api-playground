const { Controller } = require('egg');

class WorkProductController extends Controller {
  
  async listCategories() {
    try {
      const categories = await this.ctx.service.workProduct.findAllCategories();
      this.ctx.body = categories;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'error occured when getting categories'
      };
    }
  }

  async createCategory() {
    const { name, description, status } = this.ctx.request.body;
    if (!name) {
      this.ctx.body = {
        message: '分类名不能为空'
      };
      return;
    }
    try {
      await this.ctx.service.workProduct.createCategory({
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

  async destroyCategory() {
    const { id } = this.ctx.params;
    if (!/\d/.test(`${id}`)) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'ID 不合法',
      };
      return
    }
    try {
      await this.ctx.service.workProduct.destroyCategory(id);
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }

  }

  async updateCategory() {
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
      const res = await this.ctx.service.workProduct.updateCategory(id, {
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
  

  // product
  async index() {
    try {
      const threads = await this.ctx.service.workProduct.list();
      this.ctx.body = threads;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async listByCategories() {
    const { id } = this.ctx.params;
    try {
      const list = await this.ctx.service.workProduct.listByCategory(id);
      this.ctx.body = list;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async create() {
    const { 
      title = '',
      content = '',
      cid,
      status = 1,
      cover,
      price,
      origin_price,
      require_bp,
    } = this.ctx.request.body;
    try {
      const res = await this.ctx.service.workProduct.create({
        title,
        content,
        cid,
        status,
        cover,
        price,
        origin_price,
        require_bp,
      });
      this.ctx.body = {data: res};
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
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
      this.ctx.service.workProduct.delete(id);
      this.ctx.status = 204;
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
      return
    }
    try {
      const thread = await this.ctx.service.workProduct.find(id);
      this.ctx.body = thread;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    } 
  }

  async update() {
    const { id } = this.ctx.params;
    if (!/\d/.test(`${id}`)) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: 'ID 不合法',
      };
      return
    }
    const { 
      title = '',
      content = '',
      cid,
      status = 1,
      cover,
      price,
      origin_price,
      require_bp,
    } = this.ctx.request.body;
    try {
      await this.ctx.service.workProduct.update(id, { 
        title,
        content,
        cid,
        status,
        cover,
        price,
        origin_price,
        require_bp,
      });
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {message: e.message};
    }
  }

}

module.exports = WorkProductController;