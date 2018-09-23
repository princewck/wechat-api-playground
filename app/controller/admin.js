const { Controller } = require('egg');

module.exports = class AdminController extends Controller {

  async register () {
    const { username, password } = this.ctx.request.body;
    try {
      const token = await this.ctx.service.admin.register(username, password);
      const info = await this.ctx.service.admin.getByName(username);
      this.ctx.body = {
        token,
        info: {
          username: info.name,
          id: info.id,
        }
      };
      this.ctx.cookies.set('w-session', token);
    } catch (e) {
      console.error(e);
      this.ctx.body = {
        success: false,
        message: e.message,
      }
    }
  }

  async currentUserInfo() {
    const token = this.ctx.cookies.get('w-session');
    const user = await this.ctx.service.admin.getByToken(token);
    this.ctx.body = {
      ...user,
      // mock 数据
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
      userid: user.id,
      email: 'antdesign@alipay.com',
      signature: '海纳百川，有容乃大',
      title: '交互专家',
      group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
      tags: [
        {
          key: '0',
          label: '很有想法的',
        },
        {
          key: '1',
          label: '专注设计',
        },
        {
          key: '2',
          label: '辣~',
        },
        {
          key: '3',
          label: '大长腿',
        },
        {
          key: '4',
          label: '川妹子',
        },
        {
          key: '5',
          label: '海纳百川',
        },
      ],
      notifyCount: 12,
      country: 'China',
      geographic: {
        province: {
          label: '浙江省',
          key: '330000',
        },
        city: {
          label: '杭州市',
          key: '330100',
        },
      },
      address: '西湖区工专路 77 号',
      phone: '0752-268888888',      
    }
  }

}