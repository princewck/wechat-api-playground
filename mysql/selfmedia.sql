CREATE TABLE `selfmedia_posts`  (
  `id` int(4) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NULL,
  `article_type` varchar(20) NULL,
  `images` text NULL,
  `video_url` text NULL,
  PRIMARY KEY (`id`)
);