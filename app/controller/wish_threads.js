const { Controller } = require('egg');

module.exports = class WishThreadController extends Controller {
  async index() {
    try {
      const threads = await this.ctx.service.wish.list();
      this.ctx.body = threads;
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
      bgm = '', 
      background = '', 
      cid, 
      status = 1, 
      description = '', 
      auto_scroll = 0,
      cover = ''
    } = this.ctx.request.body;
    try {
      const res = await this.ctx.service.wish.create({
        title, content, bgm, background, cid, status, description, auto_scroll, cover
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
      this.ctx.service.wish.delete(id);
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
      const thread = await this.ctx.service.wish.find(id);
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
      bgm = '', 
      background = '', 
      cid, 
      status = 1, 
      description = '', 
      auto_scroll = 0 ,
      cover,
    } = this.ctx.request.body;
    try {
      await this.ctx.service.wish.update(id, { 
        title, 
        content, 
        bgm, 
        background, 
        cid, 
        status, 
        description, 
        auto_scroll,
        cover
      });
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {message: e.message};
    }
  }


}