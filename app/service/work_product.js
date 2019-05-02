const { Service } =require('egg');
const moment = require('moment');

class WorkProduct extends Service {

  // category
  async createCategory({
    name = '',
    description = '',
    status = 1,
    updated_at,
  }) {
    updated_at = updated_at || moment().format('YYYY-MM-DD');
    const sql = 'insert into work_product_category (name, description, status, updated_at) values (?, ?, ?, ?)';
    await this.app.mysql.query(sql, [name, description, status, updated_at]);
  }


  async destroyCategory(id) {
    const sql = 'delete from work_product_category where id = ?';
    await this.app.mysql.query(sql, [id]);
  }

  async updateCategory(id, {name, description, status}) {
    return await this.app.mysql.update('work_product_category', {
      id, name, description, status
    });
  }
  
  async findAllCategories() {
    const categories = await this.app.mysql.select('work_product_category', {
      where: {status: 1}
    });
    return categories;
  }

  // product
  async create({
    title, content, cid, status, cover, price, origin_price, require_bp, stock, 
  }) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const res = await this.app.mysql.insert('work_product', {
      title, content, cid, status, created_at: now, updated_at: now,
      cover, price, origin_price, require_bp, stock,
    });
    return res;
  }

  async delete(id) {
    await this.app.mysql.delete('work_product', {id});
  }

  async update(id, {
    title, content, cid, status, cover, price, origin_price, require_bp, stock
  }) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const row = {
      id,
      title, content, cid, status, cover, price, origin_price, require_bp, stock,
      updated_at: now
    };
    await this.app.mysql.update('work_product', row);
  }


  async find(id) {
    const thread = await this.app.mysql.get('work_product', {id});
    if (!thread) {
      throw new Error('no such thread');
    }
    return thread;
  }



  async list() {
    const threads = await this.app.mysql.select('work_product');
    return threads;
  }


}

module.exports = WorkProduct;