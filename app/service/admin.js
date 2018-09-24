const { Service } = require('egg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = class AdminService extends Service {


  async register( username, password) {
    const exist = await this.getByName(username);
    console.log('exist', exist);
    if (exist && exist.name) {
      throw new Error('user exist');
    }
    const salt = this.ctx.helper.randomStr();
    const encryptedPwd = _encryptPwd(password, salt);
    const secret = _getSecret(username, encryptedPwd);
    const token = _genToken(username, secret, this.config.jwt.private_key);
    await this.app.mysql.insert('admin', {
      name: username,
      password: encryptedPwd,
      salt,
      token,
    });
    return token;
  }

  async verify(token) {
    const payload = jwt.verify(token, this.config.jwt.private_key);
    const user = this.getByName(payload.username);
    const compare = _getSecret(payload.username, user.password);
    if (compare === payload.secret) {
      return await this.refreshToken(payload.username, payload.secret);
    } else {
      throw new Error('not permitted!');
    }
  }

  async login() {
    const { username, password } = this.ctx.request.body;
    const exist = this.getByName(username);
    if (!exist) {
      throw new Error('user not exist');
    }
    const salt = exist.salt;
    const encryptedPwd = _encryptPwd(password, salt);
    if (encryptedPwd !== exist.password) {
      throw new Error('password is invalid');
    }
    const secret = _getSecret(username, password);
    const newToken = await this.refreshToken(username, secret);
    return newToken;
  }

  async logout(username) {
    await this.app.mysql.delete('admin', {name: username});
  }

  async getByName(name) {
    return await this.app.mysql.get('admin', {name});
  }

  async getByToken(token) {
    const users =  await this.app.mysql.select('admin', {
      where: {token},
      columns: ['id', 'name'],
    });
    return users && users[0];
  }

  async refreshToken(username, secret) {
    const token = _genToken(username, secret, this.config.jwt.private_key);
    await this.app.mysql.query('update `admin` set token = ? where name = ?', [token, username]);
    return token;
  }
}

function _getSecret(username, password) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(username);
  sha1.update(password);
  return sha1.digest('hex');
}

function _genToken(username, secret, private_key) {
  const token = jwt.sign({
    username,
    secret,
  }, private_key, {
    expiresIn: 3600 * 24,
  });
  return token;  
}

function _encryptPwd(password, salt) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(password);
  sha1.update(salt);
  return sha1.digest('hex');
}