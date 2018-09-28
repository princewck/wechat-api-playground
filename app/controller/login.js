const { Controller } = require('egg');

module.exports = class LoginService extends Controller {

  async index() {
    const {header, body} = this.ctx.request;
    console.log(header, '\n' ,body);
    const token = header['w-session'];
    if (!token) {
      this.ctx.body = {
        success: false,
        message: 'invalid token',
      }
      this.ctx.status = 401;
    }
    else {
      try {
        const newToken = await this.ctx.service.updateLogin(token);
        this.ctx.body = {
          success: true,
          token: newToken,
        };
      } catch (e) {
        this.ctx.code = 401;
        if (e && e.message === 'jwt expires') {
          this.ctx.body = {
            success: false,
            message: 'token expires',
          };
        } else {
          this.ctx.body = {
            success: false,
            message: e && e.message || 'login error',
          };
        }
      }
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
      this.status = 500;
      this.ctx.body = {
        success: false,
        message: '登录失败',
      };      
    }
  }


}