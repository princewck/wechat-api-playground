'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const auth = app.middleware.auth({});

  router.get('/', controller.home.index);
  router.get('/push', controller.home.entry);
  router.post('/push', controller.home.entry); // 微信后台添加消息推送域名时做域名校验


  router.post('/login', controller.login.loginWithUserinfo);
  router.post('/auth', auth, controller.login.authorize);
  router.get('/test', auth, controller.home.test); // 需要校验token的请求，加入auth中间件

  router.get('/user', auth, controller.user.find);
  router.get('/user/:id', auth, controller.user.findById);

  router.get('/bp/available', auth, controller.wechat.checkAvailableBP);

  // admin
  router.get('/admin/users', controller.user.list);
  router.post('/admin/register', controller.admin.register);
  router.post('/admin/login', controller.admin.login);
  router.post('/admin/logout', controller.admin.logout);

  router.get('/admin/xpk/list', controller.alimama.getXPKList);
  router.get('/admin/xpk/detail', controller.alimama.getXPKDetail);
  router.get('/admin/tbk/categories', controller.alimama.getCategories);
  router.get('/admin/tbk/products', controller.alimama.getProductsByCategory);

  router.get('/admin/api/rest', controller.api.invoke);

  router.get('/admin/selfmedia', controller.selfmedia.list);
  router.post('/admin/selfmedia', controller.selfmedia.create);
  router.get('/admin/selfmedia/:id', controller.selfmedia.getById);
  router.put('/admin/selfmedia/:id', controller.selfmedia.update);
  router.delete('/admin/selfmedia/:id', controller.selfmedia.remove);

  router.post('/admin/selfmedia_account', controller.selfmediaAccount.create);
  router.get('/admin/selfmedia_accounts', controller.selfmediaAccount.list);
  router.delete('/admin/selfmedia_account/:id', controller.selfmediaAccount.remove);
  router.put('/admin/selfmedia_account/:id', controller.selfmediaAccount.update);
  router.get('/admin/selfmedia_account/:id', controller.selfmediaAccount.getById);

  // wish admin
  router.resources(
    'wish_categories', 
    '/admin/wish/categories', 
    controller.wishCategories
  );
  router.resources(
    'wish_thread', 
    '/admin/wish/threads', 
    controller.wishThreads
  );


  router.resources(
    'admin_assets',
    '/admin/assets',
    controller.assets,
  )

  router.resources(
    'admin_share',
    '/admin/share',
    controller.share,
  )

  router.get('/admin/sts', auth, controller.utils.stsToken); // todo add auth

  // wish miniprogram
  router.get('/wish/categories', controller.wishCategories.list);
  router.get('/wish/thread/:id', controller.wishThreads.show);
  router.post('/wish/share', auth, controller.share.create);


  router.post('/form_id/:form_id', auth, controller.wechat.recordForm);
  router.post('/admin/send_msg', controller.wechat.sendMessage)

  // 工时设置相关
  router.get('/work/setting', auth, controller.workshopManage.getSetting);
  router.put('/work/setting', auth, controller.workshopManage.updateSetting);

  router.get('/work/data', auth, controller.workshopManage.getWorkDataByDay);
  router.get('/work/data/list', auth, controller.workshopManage.getWorkDataList);
  router.post('/work/data', auth, controller.workshopManage.update);

  router.get('/work/statistics', auth, controller.workshopManage.getCalcInfo);
  router.post('/bp/login', auth, controller.wechat.loginAward);
  router.post('/bp/ads', auth, controller.wechat.adsAward);
  router.get('/vip_info', auth, controller.wechat.vipInfo);
  router.get('/vip_bp', auth, controller.wechat.vipBpList);
  router.post('/ivtd_by/:inviter', auth, controller.wechat.inviteAward);
  router.get('/ivtd', auth, controller.wechat.dailyInviteList);

  router.get('/add_mini', auth, controller.wechat.addMiniState);
  router.post('/add_mini', auth, controller.wechat.addMiniAward);

  // 签到
  router.post('/checkin/single', auth, controller.wechat.singleCheckin);
  router.get('/checkin/single', auth, controller.wechat.singleCheckinList);
  router.post('/checkin/team', auth, controller.wechat.teamCheckin);
  router.get('/checkin/team', auth, controller.wechat.dailyTeamCheckinList);

  router.get('/wechat/acode', auth, controller.wechat.getAcode);


  router.get('/work_product/categories', auth, controller.workProduct.listCategories);
  router.get('/work_product/categories/:id/products', auth, controller.workProduct.listByCategories);
  router.get('/work_product/:id', auth, controller.workProduct.show);

  router.get('/admin/work_product/categories', controller.workProduct.listCategories);
  router.post('/admin/work_product/categories', controller.workProduct.createCategory);
  router.put('/admin/work_product/categories/:id', controller.workProduct.updateCategory);
  router.delete('/admin/work_product/categories/:id', controller.workProduct.destroyCategory);
  router.get('/admin/work_product/products', controller.workProduct.index);
  router.post('/admin/work_product/products', controller.workProduct.create);
  router.get('/admin/work_product/products/:id', controller.workProduct.show);
  router.put('/admin/work_product/products/:id', controller.workProduct.update);
  router.delete('/admin/work_product/products/:id', controller.workProduct.destroy);

  router.get('/sallary_histories', auth, controller.sallaryHistory.wechatHistoryList);
  router.get('/sallary_history', auth, controller.sallaryHistory.wechatFindHistory);
  router.post('/sallary_history', auth, controller.sallaryHistory.wechatCreateSallaryHistory);

  router.post('/order', auth, controller.order.create);
};
