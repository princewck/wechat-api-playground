module.exports = option => {
  return async function verify(ctx, next) {
    try {
      // const header = ctx.header;
      const sessionToken = this.ctx.cookies.get('w-session');
      console.log('sessionToken', sessionToken);
      const token = await ctx.service.admin.verify(sessionToken);
      ctx.cookies.set('w-session', token);
      await next();
    } catch (e) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: e && e.message
      };
    }
  }
}