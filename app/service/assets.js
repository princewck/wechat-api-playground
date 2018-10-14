const { Service } = require('egg');
const moment = require('moment');

module.exports = class AssetsService extends Service {

  async listByType(type) {
    const data = await this.app.mysql.select('assets', {where: {type}});
    return data;
  }

  async listAll() {
    return await this.app.mysql.select('assets');
  }

  async create({name, description, type, value}) {
    return await this.app.mysql.insert('assets', {name, description, type, value, created_at: moment().format('YYYY-MM-DD HH:mm:ss')});
  }

  async update(id, {name, description, type}) {
    return await this.app.mysql.update('assets', {
      id,
      name,
      description,
      type
    })
  }

  async destroy(id) {
    return await this.app.mysql.delete('assets', {id});
  }

  async findById(id) {
    return await this.app.mysql.get('assets', {id});
  }

}