const { Controller } = require('egg');

module.exports = class WechatController extends Controller {

  async recordForm() {
    try {
      const { form_id } = this.ctx.params;
      const header = this.ctx.header;
      if (!form_id) throw new Error('invalid form_id');
      const token = await this.ctx.service.auth.verify(header['w-session']);   
      const user = await this.ctx.service.user.getByToken(token);
      await this.ctx.service.wechat.recordFormId(user.open_id, form_id);
      this.ctx.status = 201;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async sendMessage() {
    try {
      const { app, id, template, page, data = {}, emphasisKeyword='',  } = this.ctx.request.body;
      const config = this.config.wechat[app];
      if (!config) throw new Error('app missing!');
      const { appid, appsecret } = config;
      const user = await this.ctx.service.user.getById(id);
      const formId = await this.ctx.service.wechat.getAvailableFormId(user.open_id);
      if (!formId) {
        throw new Error('没有可用的form_id');
      }
      const accessToken = await this.ctx.service.wechat.getAccessToken(appid, appsecret);
      console.log('accessToken', accessToken);
      console.log(accessToken, user.open_id, template, page, formId, data, emphasisKeyword, app);
      await this.ctx.service.wechat.sendTemplateMessage(
        accessToken, user.open_id, template, page, formId, data, emphasisKeyword, app
      );
      this.ctx.status = 204;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  // 打卡提醒 kZE1seYo0SlPMOcsGhepsGbvlsKpn4bi-7NxTQQuuQ0
  async dailyRemind() {
    try {
      await this.ctx.service.wechat.dailyRemind();
      this.ctx.status = 204;
    } catch (e) {
      console.log(e); 
    }
  }

  async loginAward() {
    try {
      await this.ctx.service.bonusPoint.loginAward();
      this.ctx.body = {
        status: 'success',
        amount: 2,
      }
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        status: 'fail',
        amount: 0,
        message: e.message,
      };
    }
  }

  async adsAward() {
    try {
      const amount = await this.ctx.service.bonusPoint.adsAward();
      this.ctx.body = {
        status: 'success',
        amount,
      }
    } catch (e) {
      this.logger.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        status: 'fail',
        amount: 0,
        message: e.message,
      };
    }
  }

  async inviteAward() {
    try {
      const { inviter } = this.ctx.params;
      const result = await this.ctx.service.bonusPoint.inviteAward(inviter);
      this.ctx.body = {
        ...result,
        success: true,
      };
    } catch (e) {
      console.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        status: 'fail',
        amount: 0,
        message: e.message,
      };
    }
  }

  async dailyInviteList() {
    try {
      const user = await this.ctx.currentUser();
      const result = await this.ctx.service.bonusPoint.dailyInviteList(user.id);
      this.ctx.body = result;
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  //  添加到我的小程序奖励
  async addMiniAward() {
    try {
      const result = await this.ctx.service.bonusPoint.addMiniAward();
      this.ctx.body = {
        ...result,
        success: true,
      };
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        status: 'fail',
        amount: 0,
        message: e.message,
      };
    }
  }

  // 添加到我的小程序
  async addMiniState() {
    try {
      const result = await this.ctx.service.bonusPoint.addMiniState();
      this.ctx.body = {
        success: true,
        added: result,
      };
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
        message: e.message,
      };
    }
  }

  async checkAvailableBP() {
    try {
      const bp = await this.ctx.service.bonusPoint.checkAvailableBP();
      this.ctx.body = {
        amount: bp,
      };
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      };
    }
  }

  async vipInfo() {
    try {
      const bp = await this.ctx.service.bonusPoint.checkAvailableBP();
      const days = await this.ctx.service.bonusPoint.loginDays();
      const user = await this.ctx.currentUser();
      this.ctx.body = {
        bp,
        days,
        last_checkin: user.last_checkin || null,
        checkin_days: user.checkin_days || 0,
        id: user.id,
      }
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      }
    }
  }

  async vipBpList() {
    try {
      const user = await this.ctx.currentUser();
      const result = await this.ctx.service.bonusPoint.getRecentList(user.id);
      this.ctx.body = {
        data: result,
      }
    } catch (e) {
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      }
    }    
  }

  /**
   * 个人签到
   */
  async singleCheckin() {
    try {
      await this.ctx.service.checkinHistory.singleCheckin();
      this.ctx.body = {
        success: true,
      };
    } catch (e) {
      this.ctx.logger.info(e);
      this.ctx.status = 403;
      this.ctx.body = {
        message: e.message,
      }
    }
  }

  async singleCheckinList() {
    try {
      const user = await this.ctx.currentUser();
      const result = await this.ctx.service.checkinHistory.getWeeklySingleCheckinList(user.id);
      this.ctx.body = {
        success: true,
        data: result,
      };
    } catch (e) {
      this.ctx.logger.info(e);
      this.ctx.body = {
        success: false,
      }
      this.ctx.status = 403;
    }
  }

  /**
   * 组队签到
   */
  async teamCheckin() {
    try {
      const { id } = this.ctx.request.body;
      await this.ctx.service.checkinHistory.teamCheckin();
      this.ctx.body = {
        success: true,
      };
    } catch (e) {
      this.ctx.body = {
        success: false,
        message: e.message,
      };
    }
  }

  async dailyTeamCheckinList() {
    try {
      const { id } = this.ctx.request.query;
      const user = await this.ctx.currentUser();
      const result = await this.ctx.service.checkinHistory.getDailyTeamCheckinList(id, user.id);
      this.ctx.body = {
        data: result,
        success: true,
      };
    } catch (e) {
      this.ctx.logger.info(e);
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
        message: e.message,
      };
    }
  }


  async getAcode() {
    try {
      const data = await this.ctx.service.wechat.getAcode();
      this.ctx.body = data;
      // if (data.type === 'Buffer') {
      //   this.ctx.headers['content-type'] = 'image/png';
      //   this.ctx.body = Buffer.from(data.data);
      // } else {
      //   this.ctx.status = 403;
      //   this.ctx.body = data;
      // }
    } catch (e) {
      this.ctx.logger.error(e);
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
        data: e,
        message: e.message,
      };      
    }
  }
}