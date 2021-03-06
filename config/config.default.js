'use strict';

const nconf = require('nconf');

module.exports = appInfo => {

  const isLocal = appInfo.env === 'local';
  const isProd = appInfo.env === 'prod';

  nconf
  .argv()
  .env()
  .file({
    file: isLocal ? './.config.json' : isProd ? '/usr/local/opt/push/config.json': '/usr/local/opt/push_test/config.json'
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

  config.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: nconf.get('mysql_host'),
      // 端口号
      port: nconf.get('mysql_port'),
      // 用户名
      user: nconf.get('mysql_user'),
      // 密码
      password: nconf.get('mysql_password'),
      // 数据库名
      database: nconf.get('mysql_database'),
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };

  config.jwt = {
    private_key: nconf.get('jwt_private_key'),
  }

  console.log(`nconf.get('redis_password')`, nconf.get('redis_password'));

  config.redis = {
    prefix: 'wechat_api_playgroud:',
    ttl: 300,    
    client: {
      port: 6379,
      host: '127.0.0.1',
      //redis-cli:  config set requirepass m2XBfsjn1234567890
      password: nconf.get('redis_password'),
      db: 5,
    },
  }

  return config;
};
