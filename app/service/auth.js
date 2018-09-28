const { Service }  = require('egg');
const crypto = require('crypto');
// https://blog.csdn.net/u011652364/article/details/78669041
const jwt = require('jsonwebtoken');

module.exports = class AuthService extends Service {

  // get openid & session_key
  async authorize(code, appName) {
    if (!appName) {
      throw new Error('appName is missing');
    }
    const { appid, appsecret } = this.config.wechat[appName] || {};
    const res = await this.ctx.curl(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${code}&grant_type=authorization_code`, {
      dataType: 'json'
    });
    if (res.status === 200 && res.data) {
      return res.data;
    } else {
      return null;
    }
  };

  // 用 token 登录
  async verify(token) {
    // 操作数据库更新登录数据
    const user = await this.ctx.service.user.getByToken(token);
    console.log('user', user);
    if (!user) {
      throw new Error('invalid user');
    }
    // 可能会报错，在controller层拦截处理
    const payload = _verify(token, this.config.jwt.private_key);
    const { secret, user: userinfo, appName } = payload;
    const { open_id: openid, session_key, token_salt } = user;
    const time = +new Date();
    const sha1 = crypto.createHash('sha1');
    sha1.update(openid);
    sha1.update(token_salt);
    sha1.update(session_key);
    sha1.update(appName);
    const tempStr = sha1.digest('hex');
    if (secret !== tempStr) {
      throw new Error('invalid token');
    }
    return token;
    // 刷新token, 可能会有问题，每次都刷新token，多个并发请求会认证失败
    // const salt = this.ctx.helper.randomStr();
    // const newToken = _genToken(openid, session_key, userinfo, salt, this.config.jwt.private_key);
    // await this.app.mysql.query('update `user` set token_salt=?, token=?, last_login=? where open_id = ?', [
    //   salt, newToken, time, openid
    // ]);
    // return newToken;
  }

  // 用openid 登录
  async updateUserAndLogin({openid, session_key, userinfo = {}, appName}) {
    const salt = this.ctx.helper.randomStr();
    const token = _genToken(openid, session_key, userinfo, salt, this.config.jwt.private_key, appName);
    const time = +new Date();
    const { 
      nickName = '', 
      avatarUrl = '', 
      gender= 0, 
      province='', 
      city='' 
    } = userinfo;
    const sql = `
      insert into user (
        open_id, session_key, nick, avatar, gender, province, city, token, token_salt, first_login, last_login, app_name
      ) values (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ) on duplicate key update 
      session_key=VALUES(session_key),
      nick=VALUES(nick), 
      avatar=VALUES(avatar),
      province=VALUES(province),
      city=VALUES(city),
      token=VALUES(token),
      token_salt=VALUES(token_salt),
      last_login=VALUES(last_login),
      app_name=VALUES(app_name)
      `;
    await this.app.mysql.query(sql, [
      openid, session_key, nickName, avatarUrl, gender, province, city, token, salt, time, time, appName
    ]);
    return token;
  }

}

function _genToken(openid, session_key, userInfo, salt, jwt_private_key, appName) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(openid);
  sha1.update(salt);
  sha1.update(session_key);
  sha1.update(appName);
  const tempStr = sha1.digest('hex');
  const payload = {
    user: userInfo,
    secret: tempStr,
    appName,
  };
  const token = jwt.sign(payload, jwt_private_key, {
    // expiresIn: 5 // 2天后过期
    expiresIn: process.env.NODE_ENV === 'production' ? 60 * 60 * 24 * 2 : 30// 2天后过期
  });
  return token;
}

// catch outside this 
// exp: e.message = 'jwt expired'
function _verify(token, jwt_private_key) {
  return jwt.verify(token, jwt_private_key);
}