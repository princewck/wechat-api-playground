const { Controller } = require('egg');
const { ORDER_STATUS } = require('../constants');

class OrderController extends Controller {

  async create() {
    const { product_id } = this.ctx.request.body;
    const user = await this.ctx.currentUser();
    const product = await this.app.mysql.get('work_product', {id: +product_id});
    if (!product) {
      this.ctx.body = {
        message: '参数不合法',
      }
      return this.ctx.status = 403;
    }
    const order = {
      product_id: +product_id,
      title: product.title,
      price: product.price,
      origin_price: product.origin_price,
      require_bp: product.require_bp,
      paid_bp: 0,
      paid_money: 0,
      cover: product.cover,
      open_id: user.open_id,
      user_id: user.id,
      status: ORDER_STATUS.CREATED
    }
    const result = await this.ctx.service.order.create(order);
    if (result) {
      this.ctx.body = result;
    } else {
      this.ctx.body = {
        message: '创建订单失败！'
      };
      this.ctx.status = 403;
    }
  }

}

module.exports = OrderController;