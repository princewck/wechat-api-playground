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

  router.get('/admin/sts', controller.utils.stsToken); // todo add auth

  // wish miniprogram
  router.get('/wish/categories', controller.wishCategories.list);
  router.get('/wish/thread/:id', controller.wishThreads.show);
  router.post('/wish/share', auth, controller.share.create);


  router.post('/form_id/:form_id', auth, controller.wechat.recordForm);
  router.post('/admin/send_msg', controller.wechat.sendMessage)


  // 同步并兼容旧版数据
  router.post('/sync_stat', auth, controller.workshopManage.setSynced);
  router.get('/sync_stat', auth, controller.workshopManage.getSyncStat);
  router.post('/sync_data', auth, controller.workshopManage.syncStorageData);
  router.post('/sync_setting', auth, controller.workshopManage.syncStorageSetting);


  // 工时设置相关
  router.get('/work/setting', auth, controller.workshopManage.getSetting);
  router.post('/work/setting', auth, controller.workshopManage.createDefaultSetting);
  router.put('/work/setting', auth, controller.workshopManage.updateSetting);

  router.get('/work/data', auth, controller.workshopManage.getWorkDataByDay);
  router.get('/work/data/list', auth, controller.workshopManage.getWorkDataList);
  router.post('/work/data', auth, controller.workshopManage.update);

  router.get('/work/statistics', auth, controller.workshopManage.getCalcInfo);
  router.post('/bp/login', auth, controller.wechat.loginAward);


  router.get('/admin/work_product/categories', controller.workProduct.listCategories);
  router.post('/admin/work_product/categories', controller.workProduct.createCategory);
  router.put('/admin/work_product/categories/:id', controller.workProduct.updateCategory);
  router.delete('/admin/work_product/categories/:id', controller.workProduct.destroyCategory);
  router.get('/admin/work_product/products', controller.workProduct.index);
  router.post('/admin/work_product/products', controller.workProduct.create);
  router.get('/admin/work_product/products/:id', controller.workProduct.show);
  router.put('/admin/work_product/products/:id', controller.workProduct.update);
  router.delete('/admin/work_product/products/:id', controller.workProduct.destroy);

};
