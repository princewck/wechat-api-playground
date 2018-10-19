const { Service } = require('egg');
const moment = require('moment');

module.exports = class WishService extends Service {

  async create({
    title, content, bgm, background, cid, status, description, auto_scroll, cover
  }) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const res = await this.app.mysql.insert('wish_thread', {
      title, content, bgm, background, cid, status, description, auto_scroll, created_at: now, updated_at: now,
      cover
    });
    return res;
  }

  async delete(id) {
    await this.app.mysql.delete('wish_thread', {id});
  }

  async update(id, {
    title, content, bgm, background, cid, status, description, auto_scroll,cover
  }) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const row = {
      id,
      title, content, bgm, background, cid, status, description,auto_scroll,
      updated_at: now, cover
    };
    await this.app.mysql.update('wish_thread', row);
  }

  async list() {
    const threads = await this.app.mysql.select('wish_thread');
    return threads;
  }

  async find(id) {
    const thread = await this.app.mysql.get('wish_thread', {id});
    if (!thread) {
      throw new Error('no such thread');
    }
    return thread;
  }

  async findAllCategories() {
    const categories = await this.app.mysql.select('wish_category', {
      where: {status: 1}
    });
    return categories;
  }

  async findAllCategoriesWithThreads() {
    let categories = await this.app.mysql.select('wish_category', {
      where: {status: 1}
    });
    categories = categories || [];
    for (let i = 0; i < categories.length; i ++) {
      const category = categories[i];
      category.threads = await this.app.mysql.select('wish_thread', {
        where: {cid: category.id},
        columns: ['id', 'title', 'cover']
      });
    }
    return categories;
  } 

  async createCategory({
    name = '',
    description = '',
    status = 1,
    updated_at,
  }) {
    updated_at = updated_at || moment().format('YYYY-MM-DD');
    const sql = 'insert into wish_category (name, description, status, updated_at) values (?, ?, ?, ?)';
    await this.app.mysql.query(sql, [name, description, status, updated_at]);
  }

  async destroyCategory(id) {
    const sql = 'delete from wish_category where id = ?';
    await this.app.mysql.query(sql, [id]);
  }

  async updateCategory(id, {name, description, status}) {
    return await this.app.mysql.update('wish_category', {
      id, name, description, status
    });
  }

  async findCategory(id) {
    const category = await this.app.mysql.get('wish_category', {id});
    if (!category) {
      throw new Error('no such category');
    }
    return category;
  }

}
