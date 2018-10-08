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


  // admin
  router.get('/admin/users', controller.user.list);
  router.post('/admin/register', controller.admin.register);
  router.post('/admin/login', controller.admin.login);
  router.post('/admin/logout', controller.admin.logout);

  // wish
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
};
