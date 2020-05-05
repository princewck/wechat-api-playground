module.exports = {
  ORDER_STATUS: {
    CREATED: 1,
    PAID: 2,
    SHIPPING: 3,
    FINISHED: 4,
    REFUNDING: 5, // 退单中
    REDUNDED: 6, // 已退款
  },
  WORK: {
    SETTING_BY_ID: 'setting_by_id',
    DATA_BY_DAY: 'data_by_day',
    DATA_BY_DURATION: 'data_by_duration',
    CALC_INFO: 'calc_info'
  },
  METHODS: {
    BY_EXTRA: 'primary_with_extra', // 基本工资 + 加班费
    BY_HOUR: 'hour_with_extra', // 单纯按小时计算
    BY_COUNT: 'by_count'
  },
}