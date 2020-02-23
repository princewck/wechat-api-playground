/**
 * 更新选品库
 */
const { Subscription } = require('egg');

/**
 * 更新选品库信息
 * 
 */ 
class TKProductsUpdate extends Subscription {
  static get schedule() {
    return {
      type: 'worker',
      cron: '0 0 */1 * * 1-6',      
      immediate: true,
      env: ['prod', 'local']
    };
  }

  async subscribe () {
    try {
      await this.ctx.service.alimama.updateXPK();
    } catch (e) {
      this.ctx.logger.error(e);
    }
  }  
}

module.exports = TKProductsUpdate;