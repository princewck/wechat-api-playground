const Puppet = require('../utils/puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Service } = require('egg');


function delay(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}

class AlimamaService extends Service {

  async checkLoginState() {
    let browser;
    try {
      browser = await Puppet.createBrowser();
      const page = await browser.newPage();
      await Puppet.restoreCookies('alimama_login_check', page);
      await page.goto('https://www.alimama.com/', {waitUntil: 'networkidle2'});
      const hasLogin = await page.$eval('#J_menu_login', el => {
        return window.getComputedStyle(el).display === 'none';
      });
      this.updateStateJson(hasLogin, undefined);
    } catch (e) {
      console.error(e);
      this.logger.error(e);
    }
    if (browser) {
      await browser.close();
    }
  }


  async startLogin() {
    let browser;
    try {
      browser = await Puppet.createBrowser();
      const page = await browser.newPage();
      await page.goto('https://www.alimama.com/', {waitUntil: 'networkidle2', timeout: 60000});
      await Promise.all([
        page.waitForSelector('iframe[name="taobaoLoginIfr"]'),
        page.click('#J_menu_login', { delay: 10 }),
      ]);
      const $ifr = await page.$('iframe[name="taobaoLoginIfr"]');
      const iFrame = await $ifr.contentFrame();
      await iFrame.waitForSelector('#J_LoginBox');
      try {
        await iFrame.click('#J_Static2Quick', { timeout: 10 });
      } catch (e) {
        console.log('已经是扫码模式登陆页');
      }
      await iFrame.waitForSelector('#J_QRCodeImg img');
      const url = await iFrame.$eval('#J_QRCodeImg img', elm => elm.getAttribute('src'));
      this.updateStateJson(false, '登陆中，请扫码', url);
      await page.waitForNavigation({
        timeout: 60000,
        waitUntil: 'load',
      });
      const cookies = await page.cookies();
      Puppet.cacheCookies('alimama_login_check', cookies);
      this.updateStateJson(true, '已登陆', url);
    } catch (e) {
      console.error(e);
      this.updateStateJson(false, '登陆失败，请重新发起登陆');
    }
    if (browser) {
      await browser.close();
    }
  }

  /** private */
  updateStateJson(hasLogin, message = '', qrcode) {
    console.log(hasLogin, message, qrcode);
    const data = {
      login: !!hasLogin,
      message,
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    if (qrcode) {
      data.qrcode = qrcode;
    }
    fs.writeFileSync(
      path.resolve(__dirname, '../public/alimama_stat.json'),
      JSON.stringify(data, null, 2),
    );
  }
}

module.exports = AlimamaService;