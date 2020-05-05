'use strict';

const nconf = require('nconf');

module.exports = appInfo => {

  const isProd = appInfo.env === 'prod';

  nconf
    .argv()
    .env()
    .file({
      file: './.config.json',
    });

  const config = exports = {};


  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1537435491328_2900';

  // add your config here
  config.middleware = [];

  config.security = {
    csrf: {
      enable: false,
    }
  };

  config.wechat = nconf.get('wechat');

  config.alimama = {
    appKey: nconf.get('alimama_app_key'),
    appSecret: nconf.get('alimama_app_secret'),
    adZoneId: nconf.get('alimama_ad_zone'),
  };

  config.oss = nconf.get('oss');

  config.tianApiKey = nconf.get('tianapi_key');

  return config;

}