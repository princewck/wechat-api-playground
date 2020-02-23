const { Controller } = require('egg');

class AlimamaController extends Controller {

  async getXPKList() {
    const { page, per_page } = this.ctx.query;
    const result = await this.service.alimama.getXPKList(page, per_page);
    this.ctx.body = result;
  }

  async getXPKDetail() {
   const { favoritesId, page, per_page } = this.ctx.query;
   const result = await this.service.alimama.getXPKDetail(favoritesId, page, per_page);
   this.ctx.body = result;
  }
}

module.exports = AlimamaController;