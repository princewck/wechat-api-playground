CREATE TABLE `selfmedia_posts`  (
  `id` int(4) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NULL,
  `article_type` varchar(20) NULL,
  `images` text NULL,
  `video_url` text NULL,
  PRIMARY KEY (`id`)
);

ALTER TABLE `selfmedia_posts` 
ADD COLUMN `expires_at` datetime(6) NULL AFTER `video_url`;

CREATE TABLE `selfmedia_accounts`  (
  `id` int(4) NOT NULL,
  `username` varchar(255) NULL,
  `phone_number` varchar(255) NULL,
  `password` varchar(255) NULL,
  `type` varchar(255) NULL,
  `created_at` datetime(0) NULL,
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
);

ALTER TABLE `push_test`.`selfmedia_accounts` 
MODIFY COLUMN `id` int(4) UNSIGNED NOT NULL AUTO_INCREMENT FIRST;