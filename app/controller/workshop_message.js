const { Controller } = require('egg');
module.exports = class WorkshopMessageControlelr extends Controller {

  async dailyRemindUsers() {
    try {
      const users = await this.service.workshopMessage.dailyRemind();
      this.ctx.body = users;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }


}