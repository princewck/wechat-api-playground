const { Controller } = require('egg');

module.exports = class LoginService extends Controller {

  async authorize() {
    this.ctx.body = {
      success: true,
      message: '已登陆'
    };
  }

  async loginWithUserinfo() {
    try {
      const { body } = this.ctx.request;
      const { code, userInfo, appName } = body;
      const info = await this.ctx.service.auth.authorize(code, appName);
      if (info) {
        const token = await this.ctx.service.auth.updateUserAndLogin({
          ...info,
          userinfo: userInfo,
          appName
        });
        this.ctx.body = {
          success: true,
          token: token,
        }
      } else {
        this.ctx.code = 400;
        this.ctx.body = {
          success: false,
          message: '登录失败',
        };
      }
    } catch (e) {
      console.error(e);
      this.status = 500;
      this.ctx.body = {
        success: false,
        message: '登录失败',
      };      
    }
  }


}