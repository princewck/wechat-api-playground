/**
 * http://gosspublic.alicdn.com/ram-policy-editor/index.html?spm=a2c63.p38356.a3.19.16d83205dTXfKT
 *  https://www.alibabacloud.com/help/zh/doc-detail/32077.htm?spm=a2c63.p38356.b99.230.48747557eMRsTW */
const OSS = require('ali-oss');
const { Service } = require('egg');

module.exports = class STSService extends Service {
  
  constructor(app) {
    super(app);
    this.sts = new OSS.STS(this.config.oss);
  }

  async getSTSToken() {
    try {
      const arn = 'acs:ram::1646881312224974:role/wlog-role';
      const policy = {
        "Statement": [
          {
            "Action": [
              "oss:GetObject",
              "oss:ListObjects",
              "oss:PutObject",
              "oss:DeleteObject",
            ],
            "Effect": "Allow",
            "Resource": ["acs:oss:*:*:wblogimages/*"] // 最后的"/*"很重要，没有的话实际上是没有上传到该路径的权限的
          }
        ],
        "Version": "1"
      };
      const expireation = 15 * 60;
      const sessionName = 'wlogOssSessionId'

      let { credentials } = await this.sts.assumeRole(arn, policy, expireation, sessionName);
      return credentials;
    } catch (e) {
      return Promise.reject(e);
    }
  }
}