const { Service } = require('egg');
const moment = require('moment');

class CheckinHistoryService extends Service {

  /**
   * 
   * @param {number} type 1 个人 2团队
   * @param {} id 
   */
  async singleCheckin() {
    const user = await this.ctx.currentUser();
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
      const conn = await this.app.mysql.beginTransaction();
      const checkinDone = await this.app.mysql.get('checkin_history', {
        where: {
          user_id: user.id,
          date: {
            $between: [dstart, dend],
          }
        }
      });
      if (checkinDone) {
        throw new Error('今天您已经签到过了！');
      }
      await conn.insert('checkin_history', {
        user_id: user.id,
        date: now,
        status: 1,
        type: 1,
        created_at: now,
        bp: 3,
      });
      const updateUserBp = `update user set bp = bp + 3 where id in (${ids.join(',')})`;
      await conn.query(updateUserBp);
      await conn.insert('bonuspoint', { amount: 3, user_id: user.id, type: 'get', action: 'single_checkin', created_at: now, updated_at: now });

      // 更新签到天数信息
      const userInformation = await conn.select('user', {where: { id: user.id }});
      const { last_checkin, checkin_days = 0 } = userInformation;
      const yesterday_start = moment().subtract(1, 'days').startOf('day');
      const yesterday_end = moment().subtract(1, 'days').endOf('day');
      const m  = moment(last_checkin);
      if (last_checkin && m.isBefore(yesterday_end) && m.isAfter(yesterday_start)) {
        const updateCheckinDaysSql = 'update user set checkin_days = ?, last_checkin = ? where id = ?';
        await conn.query(updateCheckinDaysSql, [checkin_days + 1, now, user.id]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }

    return {
      amount: 3,
      date: now,
    }
  }

  // 获取过去一周个人签到信息
  async getWeeklySingleCheckinList(userId) {
    const wstart = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');
    const wend = moment().format('YYYY-MM-DD HH:mm:ss');
    return await this.app.mysql.select('checkin_history', {
      user_id: userId,
      type: 1,
      date: {
        $between: [wstart, wend],
      }
    });
  }

  /**
   * 只有count = aim_count时，才统一发放积分
   */
  async teamCheckin(id) {
    const user = await this.ctx.currentUser();
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const conn = await this.app.mysql.beginTransaction();
    try {
      const exist = await conn.get('checkin_history', {
        user_id: user.id,
        date: { $between: [dstart, dend] },
        type: 2,
      });
      if (exist && exist.host === user.id) {
        throw new Error('每人一天只能发起一次组队');
      }
      if (!id) {
        await conn.insert('checkin_history', {
          user_id: user.id,
          date: now,
          status: 1,
          type: 2,
          created_at: now,
          bp: 0,
          host: user.id,
          count: 1,
          aim_count: 4,
        });
        const result = await conn.get('checkin_history', {
          date: { $between: [dstart, dend] },
          host: user.id,
        });
        return result;
      }
      if (!exist) {
        // 有 id ，但是找不到记录
        throw new Error('操作不被允许');
      }

      const team = await conn.get('checkin_history', { id });
      await conn.insert('checkin_history', {
        user_id: user.id,
        date: now,
        status: 1,
        type: 2,
        created_at: now,
        bp: 0,
        host: team.host,
        count: 1,
        aim_count: 4,
      })
      const teamItems = await conn.select('checkin_history', {
        type: 2,
        host: team.host,
        date: { $between: [dstart, dend] },
      });
      if (teamItems.length >= 4) {
        const sql = 'update checkin_history set bp = ? where host = ? and date between ? and ?';
        await conn.query(sql, [10, team.host, dstart, dend]);
        const ids = teamItems.map(i => i.id);
        const updateUserBp = `update user set bp = bp + 10 where id in (${ids.join(',')})`;
        await conn.query(updateUserBp);
        for (let i = 0; i < ids.length; i ++) {
          await conn.insert('bonuspoint', { amount: 10, user_id: ids[i], type: 'get', action: 'team_checkin', created_at: now, updated_at: now });
        }
      }
      await conn.commit();
    } catch (e) {
      conn.rollback();
      throw e;
    }
  }

  // 获取当天组队签到信息, 没有 checkinHistoryId 时查 host = userId 的记录
  async getDailyTeamCheckinList(checkinHistoryId, userId) {
    let item;
    const dstart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const dend = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    if (checkinHistoryId) {
      item = await this.app.mysql.get('checkin_history', {id: checkinHistoryId});
    } else {
      item = await this.app.mysql.get('checkin_history', {
        host: userId,
        date: {
          $between: [dstart, dend],
        }
      });
    }
    return await this.app.mysql.select('checkin_history', {
      user_id: userId,
      type: 2,
      host: item.host,
      date: {
        $between: [dstart, dend],
      }
    });
  }

}

module.exports = CheckinHistoryService;