const { Controller } = require('egg');
const moment = require('moment');

class SallaryHistoryController extends Controller {

  async wechatHistoryList() {
    try {
      let { year } = this.ctx.request.query;
      year = year || moment().format('YYYY');
      const user = await this.ctx.currentUser();
      if (!user) {
        throw new Error('非法的请求！');
      }
      const list = await this.ctx.service.sallaryHistory.list(user.id, +year);
      this.ctx.body = list;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      }
    }
  }

  async wechatCreateSallaryHistory() {
    try {
      const { year, month, data, comment, custom, start, end } = this.ctx.request.body;
      if (!year || !month || !(+custom >= 0) || !data) {
        throw new Error('参数不合法');
      }      
      const user = await this.ctx.currentUser();
      if (!user) {
        throw new Error('非法的请求！');
      }
      await this.ctx.service.sallaryHistory.create(user.id, year, +month, +custom, data, comment, start, end);
      this.ctx.status = 201;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async wechatFindHistory() {
    try {
      const user = await this.ctx.currentUser();
      if (!user) {
        throw new Error('非法的请求！');
      }      
      let { month, year } = this.ctx.request.query;
      if (!month || !year) {
        const m = moment();
        year = m.format('YYYY');
        month = +m.format('MM');
      }
      const detail = await this.ctx.service.sallaryHistory.find(user.id, year, month);
      this.ctx.body = {
        month: +month,
        year: +year,
        detail
      };
    } catch (e) {
      this.ctx.body = {
        message: e.message,
      };
      this.ctx.status = 403;
    }
  }

}

module.exports = SallaryHistoryController;