create view  oneday_message_history as select to_user, count(id) as sent_count from message_history where created_at > DATE_SUB(NOW(),INTERVAL 1 DAY);

create view unused_forms as select count(id) as form_id_count, open_id as openid  from form_ids where expires_at > NOW() and used = 0 GROUP BY open_id;

create view daily_remind_list as 	select * from user as u
    left join oneday_message_history as h  on h.to_user = u.open_id 
    left join unused_forms as f on f.openid = u.open_id 
    where (h.sent_count is null or h.sent_count < 1) and (f.form_id_count is not null or f.form_id_count > 0) and (u.last_login < (unix_timestamp(now()) * 1000 - 24 * 3600 * 1000) or u.last_login is null);
