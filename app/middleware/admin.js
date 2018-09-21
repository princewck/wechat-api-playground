module.exports = option => {
  return async function verify(ctx, next) {
    try {
      const header = ctx.header;
      const token = await ctx.service.admin.verify(header['w-session']);
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