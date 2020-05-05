const { Controller } = require('egg');
const moment = require('moment');

module.exports = class WorkshopManageController extends Controller {
  async getSetting() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const setting = await this.ctx.service.workshopManage.getSetting(user.id);
      this.ctx.body = setting;
    } catch (e) {
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取设置信息失败！'
      };
    }
  }

  async updateSetting() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const data = this.ctx.request.body;
      await this.ctx.service.workshopManage.updateSetting(user.id, data);
      this.ctx.status = 204;
    } catch (e) {
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '更新设置失败！'
      };
    }
  }

  async update() {
    try {
      const { date, data } = this.ctx.request.body;
      if (!moment(date).isValid()) {
        throw new Error('时间格式不正确');
      }
      if (!data) {
        throw new Error('工时数据不合法');
      }
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);  
      await this.ctx.service.workshopManage.update(user.id, date, data);
      this.ctx.status = 204;
    } catch (e) {
      this.logger.error(e);
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '更新数据失败'
      };
    }
  }

  async getCalcInfo() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const { start, end } = this.ctx.request.query;
      const result = await this.ctx.service.workshopManage.getCalcInfo(user.id, start, end);
      this.ctx.body = result;
    } catch (e) {
      console.error(e);
      this.ctx.logger.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取工时统计信息失败！'
      };
    }
  }

  async getWorkDataList() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const { start, end } = this.ctx.request.query;      
      const data = await this.ctx.service.workshopManage.getWorkData(user.id, start, end);
      this.ctx.body = data;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取数据失败',
      }
    }
  }

  async getWorkDataByDay() {
    try {
      const header = this.ctx.header;
      const { date } = this.ctx.query;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const data = await this.ctx.service.workshopManage.getWorkDataByDay(user.id, +date);
      this.ctx.body = data;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取数据失败',
      };
    }
  }

}