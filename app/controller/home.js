'use strict';

const crypto = require('crypto');

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, egg';
  }

  async entry() {
		const query = this.ctx.query;
   	const { signature, echostr, timestamp, nonce } = query;
		const token = 'wangchengkai';
		const arr = [token, timestamp, nonce];
		arr.sort();
		const str = arr.join('');
		const sha1 = crypto.createHash('sha1');
		sha1.update(str);
		const tempStr = sha1.digest('hex');
		console.log(query, this.ctx.params,  tempStr, signature);
		if (tempStr === signature) {
			this.ctx.body = echostr;
		} else {
			this.ctx.body = query;
		}
  }
}

module.exports = HomeController;
