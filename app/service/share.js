const { Service } = require('egg');

module.exports = class ShareService extends Service {


  async create(threadId) {
    const header = ctx.header;
    const token = await this.ctx.service.auth.verify(header['w-session']);    
    const user = await this.ctx.service.user.getByToken(token);
    return await this.app.mysql.insert('share_info', {
      open_id: user.open_id,
      thread_id: threadId,
    });
  }

  async listByThread(threadId) {
    return await this.app.mysql.select('share_info', {
      where: { thread_id, threadId },
    });
  }
}