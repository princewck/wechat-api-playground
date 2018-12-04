const { Controller } = require('egg');
const moment = require('moment');

module.exports = class WorkshopManageController extends Controller {

  async setSynced () {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);  
      await this.ctx.service.workshopManage.setSynced(user.id);
      this.ctx.status = 204;
    } catch (e) {
      this.logger.error(e);
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async getSyncStat() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);        
      const record = await this.service.workshopManage.getSyncStat(user.id);
      this.ctx.body = {
        data: !!record,
      };
    } catch (e) {
      this.logger.error(e);
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取数据失败！'
      };
    }
  }

  // 同步原来localStorage中的数据到数据库
  async syncStorageData() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);      
      await this.ctx.service.workshopManage.syncStorageData(user.id, this.ctx.request.body);
      this.ctx.status = 204;
    } catch (e) {
      console.error(e);
      this.logger.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: '同步数据失败'
      };
    }
  }


  async syncStorageSetting() {
   try {
    const header = this.ctx.header;
    const token = await this.ctx.service.auth.verify(header['w-session']);    
    const user = await this.ctx.service.user.getByToken(token);      
    const data = this.ctx.request.body;
    await this.ctx.service.workshopManage.syncStorageSetting(user.id, data);
    this.ctx.status = 204;
   } catch (e) {
     console.error(e);
     this.ctx.logger.error(e);
     this.ctx.status = 403;
     this.ctx.body = {
       message: '同步设置失败！'
     };
   }
  }

  async getSetting() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const setting = await this.ctx.service.workshopManage.getSetting(user.id);
      this.ctx.body = setting;
    } catch (e) {
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
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '更新设置失败！'
      };
    }
  }

  async createDefaultSetting(userId) {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);  
      await this.ctx.service.workshopManage.createDefaultSetting(user.id);    
    } catch (e) {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
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

  async getWorkDataByDay() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);   
      const { date } = this.ctx.request.body;
      const data = await this.ctx.service.workshopManage.getWorkDataByDay(user.id, date);
      this.ctx.body = data;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '获取数据失败',
      };
    }
  }

}