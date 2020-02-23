const Puppet = require('../utils/puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Service } = require('egg');
const TopClient = require('node-taobao-topclient').default;


let updating = false;

function delay(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}

// 去掉选品库名字中的数字
function prepareXPKName(name = '') {
  return name.replace(/\d/g, '');
}

/**
 * 
 * @param {*} xpkName 选品库名称
 * @param {*} item 
 */
function insertionSqlBuilder(xpkName, items) {
  let sql = 'INSERT INTO tbk_products ';
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  sql += `(
    num_iid,
    category,
    click_url,
    event_end_time,
    event_start_time,
    item_url,
    pict_url,
    provcity,
    reserve_price,
    small_images,
    \`status\`,
    title,
    tk_rate,
    volume,
    zk_final_price,
    zk_final_price_wap,
    coupon_click_url,
    coupon_start_time,
    coupon_end_time,
    coupon_info,
    coupon_total_count,
    coupon_remain_count,
    xpk_name,
    description,
    created_at,
    updated_at
  )`;
  sql += ' VALUES ';
  sql += items.map(item => `(
    ${item.num_iid},
    ${item.category || 0},
    \'${item.click_url}\',
    \'${item.event_end_time}\',
    \'${item.event_start_time}\',
    \'${item.item_url}\',
    \'${item.pict_url}\',
    \'${item.provcity}\',
    \'${item.reserve_price}\',
    \'${JSON.stringify(item.small_images)}\',
    ${item.status || 0},
    \'${item.title}\',
    ${item.tk_rate || 0},
    ${item.volume || 0},
    ${item.zk_final_price || 0},
    ${item.zk_final_price_wap || 0},
    \'${item.coupon_click_url || ''}\',
    \'${item.coupon_start_time || now}\',
    \'${item.coupon_end_time || now}\',
    \'${item.coupon_info || ''}\',
    ${item.coupon_total_count || 0},
    ${item.coupon_remain_count || 0},
    \'${xpkName}\',
    \'\',
    \'${now}\',
    \'${now}\'
  )`).join(',');
  sql += ' ON DUPLICATE KEY UPDATE ';
  sql += ` \`status\`= values(status),`;
  sql += ` coupon_remain_count=values(coupon_remain_count),`
  sql += ` updated_at=values(updated_at)`;
  sql = sql.replace(/undefined/g, '');
  return sql;
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

  async getXPKList(page = 1, perPage = 20) {
    const { appKey, appSecret } = this.config.alimama;
    const client = new TopClient({
      appkey: appKey,
      appsecret: appSecret,
      REST_URL: 'https://eco.taobao.com/router/rest',
    });
    const result = await client.execute('taobao.tbk.uatm.favorites.get', {
      page_size: perPage,
      page_no: page,
      fields: 'favorites_title,favorites_id,type',
    }, 'GET');
    return result;
  }

  async getXPKDetail(favoritesId, page = 1, perPage = 20) {
    const { appKey, appSecret, adZoneId } = this.config.alimama;
    const client = new TopClient({
      appkey: appKey,
      appsecret: appSecret,
      REST_URL: 'https://eco.taobao.com/router/rest',
    });
    const result = await client.execute('taobao.tbk.uatm.favorites.item.get', {
      adzone_id: adZoneId,
      favorites_id: favoritesId,
      fields: [
        'num_iid',
        'title',
        'pict_url',
        'small_images',
        'reserve_price', // 一口价
        'zk_final_price', //折扣价格
        'provcity', // 所在地
        'item_url',
        'click_url', // 淘客地址
        'volume', // 30天销量
        'tk_rate',// 收入比例 %
        'zk_final_price_wap', //无线折扣价，即宝贝在无线上的实际售卖价格
        'event_start_time',
        'event_end_time',
        'status', // 0 失效
        'category',//类目
        'coupon_click_url', // 优惠券连接
        'coupon_start_time',// 优惠券开始时间
        'coupon_end_time', // 优惠券结束时间
        'coupon_info', // 优惠券面额,
        'coupon_total_count',
        'coupon_remain_count',
      ].join(','),
      page_no: page,
      page_size: perPage,
    }, 'GET');
    return result;
  }

  // 获取数据库中的信息
  async getCategories() {
    const data = await this.app.mysql.select('tbk_xkp');
    return data;
  }

  async getProductsByCategory(category, page = 1) {
    const data = await this.app.mysql.select('tbk_products', {
      where: { xpk_name: category, status: 1 },
      offset: (page - 1) * 20,
      limit: 20,
    });
    const total = await this.app.mysql.count('tbk_products', { xpk_name: category, status: 1 });
    return {
      products: data,
      total_count: total,
      current_page: page,
      total_pages: Math.ceil(total / 20),
    }
  }

  /** 更新选品库信息 */
  async updateXPK() {
    if (updating) {
      this.logger.info('上次更新未完成，取消本次商品定时更新计划');
      return;
    }
    updating = true;
    try {
      const { results } = await this.getXPKList(1, 100);
      const xpkList = results.tbk_favorites; // 选品库列表
      if (xpkList && xpkList.length > 0) {
        while(xpkList.length > 0) {
          const item = xpkList.shift();
          console.log('开始处理：');
          console.log(JSON.stringify(item, null, 2));
          console.log('\n');
          try {
            let data = [];
            const { favorites_id, favorites_title } = item;
            const result = await this.getXPKDetail(favorites_id, 1, 100);
            const { results: rt, total_results: count } = result;
            const { uatm_tbk_item: items = [] } = rt;
            console.log('favorites_id', favorites_id);
            console.log('count', count);
            data = data.concat(items);
            if (count > 100) {
              console.log('favorites_id', favorites_id);
              const { results: rt2 } = await this.getXPKDetail(favorites_id, 2, 100);
              const { uatm_tbk_item: items2 = [] } = rt2;
              data = data.concat(items2);
            }
            console.log('data.length', data.length);
            if (data.length === 0) {
              continue;
            }
            const sql = insertionSqlBuilder(prepareXPKName(favorites_title), data);
            this.logger.info(`----同步商品：批量插入数据 ${favorites_title} start----`);
            this.logger.info(sql);
            await this.app.mysql.query(sql);
            this.logger.info(`----同步商品：批量插入数据 ${favorites_title} end----`);               
          } catch (e) {
            console.error('出错，跳过', e.message);
            this.logger.error(e);            
            continue;
          }       
        }
      }
    } catch (e) {
      // console.error(e);
      // this.logger.error(e);
    }
    updating = false;
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