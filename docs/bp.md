## 用户积分功能设计

我的积分： 缓存在user.bp字段，用的时候直接查

记录推荐新用户：存在bonuspoint表，action = 'invite'
添加到我的小程序： 存在bonuspoint表，action = 'add_my_mini'
用户邀请关系：user.inviter

组团签到：checkin_history表，团队和个人做区分

连续签到天数： 查 user.checkin_days, last_checkin
前7天的登陆情况： 查checkin_history表

提现申请和记录查询： withdraw_apply表



