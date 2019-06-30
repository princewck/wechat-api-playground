const { Service } = require('egg');
const moment = require('moment');

class OrderService extends Service {

  async index() {
    //
  }

  async getOrderById(userId) {
    //
  }

  async create({ title, price, origin_price, require_bp, cover, open_id, user_id, status, paid_bp, paid_money, comment, description, product_id  }) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const orderNumber = await this.ctx.helper.genOrderNumber();
    const order = { order_number: orderNumber, title, price, origin_price, require_bp, cover, open_id, user_id, status, paid_bp, paid_money, comment, description, product_id, created_at: now, updated_at: now  };

    const conn = await this.app.mysql.beginTransaction();
    try {
      await conn.insert('orders', order);
      await conn.query('update user set bp = bp - ? where open_id = ?', [require_bp, open_id]);
      await conn.insert('bonuspoint', { amount: require_bp, user_id, type: 'consume', action: 'purchase', created_at: now, updated_at: now });
      await conn.query('update work_product set stock = stock - 1 where id = ?', [product_id]);
      await conn.commit();
      return order;
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return false;
    }
  }

  async pay({ order_number }) {
    
  }


}

module.exports = OrderService;