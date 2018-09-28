const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file({
    file: '/usr/local/opt/push_test/config.json'
  });

  module.exports = appInfo => {
    const config = exports = {};
    config.wechat = nconf.get('wechat');
  }