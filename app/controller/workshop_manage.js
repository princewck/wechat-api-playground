const { Controller } = require('egg');

module.exports = class WorkshopManageController extends Controller {

  // 同步原来localStorage中的数据到数据库
  async syncStorageData() {
    try {
      const header = this.ctx.header;
      const token = await this.ctx.service.auth.verify(header['w-session']);    
      const user = await this.ctx.service.user.getByToken(token);      
      await this.ctx.service.workshopManage.syncStorageData(user.id, this.ctx.body);
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: '操作失败'
      };
    }
  }




}