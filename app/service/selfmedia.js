const { Service } = require('egg');
const cheerio = require('cheerio');

class MediaService extends Service {

  async create(data) {
    const { title, content = '', article_type } = data;
    const $ = cheerio.load(content);
    let videoUrl = null;
    const images = [];
    $('.video-url').each(function() {
      videoUrl = $(this).attr('data-url');
    });
    $('img').each(function() {
      images.push($(this).attr('src'));
    });
    await this.app.mysql.insert('selfmedia_posts', {
      title, content, article_type, video_url: videoUrl,
      images: JSON.stringify(images),
    });
  }

  async update(id, data) {
    const { title, content = '', article_type } = data;
    const $ = cheerio.load(content);
    let videoUrl = null;
    const images = [];
    $('.video-url').each(function() {
      videoUrl = $(this).attr('data-url');
    });
    $('img').each(function() {
      images.push($(this).attr('src'));
    });
    await this.app.mysql.update('selfmedia_posts', {
      id,
      title, content, article_type, video_url: videoUrl,
      images: JSON.stringify(images),
    });
  }  

  async getById(id) {
    return await this.app.mysql.get('selfmedia_posts', {
      id,
    });
  }

  async list(page = 1) {
    const data = await this.app.mysql.select('selfmedia_posts', {
      offset: (page - 1) * 20,
      limit: 20,
    });
    const total = await this.app.mysql.count('selfmedia_posts');
    return {
      list: data,
      total_count: total,
      current_page: page,
      total_pages: Math.ceil(total / 20),
    }
  }
}

module.exports = MediaService;