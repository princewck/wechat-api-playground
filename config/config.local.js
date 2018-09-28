const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file({
    file: '/usr/local/opt/push_test/config.json'
  });

  config.wechat = nconf.get('wechat');
