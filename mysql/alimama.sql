CREATE TABLE `tbk_products`  (
  `num_iid` int(64) UNSIGNED NOT NULL,
  `category` int(4) NULL,
  `click_url` text NULL,
  `event_end_time` datetime(0) NULL,
  `event_start_time` datetime(0) NULL,
  `item_url` text NULL,
  `pict_url` text NULL,
  `provcity` varchar(255) NULL,
  `reserve_price` decimal(10, 2) NULL,
  `small_images` text NULL,
  `status` int(1) NULL,
  `title` varchar(255) NULL,
  `tk_rate` decimal(10, 2) NULL,
  `volume` int(8) NULL,
  `zk_final_price` decimal(10, 2) NULL,
  `zk_final_price_wap` decimal(10, 2) NULL,
  `xpk_name` varchar(255) NULL COMMENT '选品库名称',
  `description` text NULL COMMENT '描述信息，富文本',
  `created_at` datetime(0) NULL,
  `updated_at` datetime(0) NULL,
  PRIMARY KEY (`num_iid`),
  UNIQUE INDEX `key_iid`(`num_iid`) USING BTREE
);


ALTER TABLE `tbk_products` 
ADD COLUMN `coupon_click_url` text NULL AFTER `updated_at`,
ADD COLUMN `coupon_start_time` datetime(0) NULL AFTER `coupon_click_url`,
ADD COLUMN `coupon_end_time` datetime(0) NULL AFTER `coupon_start_time`,
ADD COLUMN `coupon_info` varchar(255) NULL AFTER `coupon_end_time`,
ADD COLUMN `coupon_total_count` int(16) NULL AFTER `coupon_info`,
ADD COLUMN `coupon_remain_count` int(16) NULL AFTER `coupon_total_count`;

ALTER TABLE `tbk_products` 
MODIFY COLUMN `num_iid` bigint(20) UNSIGNED NOT NULL FIRST;


CREATE VIEW `tbk_xkp` AS select xpk_name from tbk_products group by xpk_name;