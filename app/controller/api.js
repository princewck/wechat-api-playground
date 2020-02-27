const { Controller } = require('egg');

class ApiController extends Controller {

  async invoke() {
    const { type } = this.ctx.query;
    let result;
    switch (type) {
      case 'duanzi':
        result = await this.service.api.getXiaoDuanzi();
        break;
      case 'daily_post':
        result = await this.service.api.getDailyPost();
        break;
      case 'night_wish':
        result = await this.service.api.getNightWish();
        break;
      default:
        result = {message: '类型参数不正确'};
    }
    this.ctx.body = result;
  }


}

module.exports = ApiController;