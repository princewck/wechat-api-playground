const { Service } = require('egg');

class ApiService extends Service {

  /** 获取小段子 */
  async getXiaoDuanzi() {
    const APIKEY = this.config.tianApiKey
    const { data } = await this.ctx.curl(`http://api.tianapi.com/txapi/mnpara/index?key=${APIKEY}`, {
      method: 'POST',
      dataType: 'json',
    });
    return data.newslist;
  }

  /** 获取每日简报 */
  async getDailyPost() {
    const APIKEY = this.config.tianApiKey
    const result = await this.ctx.curl(`http://api.tianapi.com/bulletin/index?key=${APIKEY}`, {
      method: 'POST',
      dataType: 'json',
    });
    return result;
  }


  /** 获取晚安心语 一天一次/账号 */
  async getNightWish() {
    const APIKEY = this.config.tianApiKey
    const result = await this.ctx.curl(`http://api.tianapi.com/txapi/wanan/index?key=${APIKEY}`, {
      method: 'POST',
      dataType: 'json',
    });
    return result;
  }


}

module.exports = ApiService;