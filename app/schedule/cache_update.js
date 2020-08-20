const { Subscription } = require('egg');

class UpdateCache extends Subscription {
  static get schedule() {
    return {
      type: 'worker',
      cron: '* */30 * * * *',
      immediate: true,
      // env: ['prod']
    };
  }

  async subscribe () {
    // const users = await this.service.user.listActiveUsers('workshop_new', 2);
    // const ids = users.map(i => i.id);
    // if (!ids.length) return;
    // await this.ctx.service.workshopManage.cacheSettings(ids);
    // await this.ctx.service.workshopManage.cacheWorkData(ids);
    // await this.ctx.service.workshopManage.cacheStatistics(ids);
    // console.log('完成缓存刷新');
  }  
}

module.exports = UpdateCache;