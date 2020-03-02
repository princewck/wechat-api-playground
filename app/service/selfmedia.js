const { Service } = require('egg');
const cheerio = require('cheerio');

class MediaService extends Service {

  async create(data) {
    const { title, content = '', article_type, expires_at } = data;
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
      images: JSON.stringify(images), expires_at,
    });
  }

  async update(id, data) {
    const { title, content = '', article_type, expires_at } = data;
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
      expires_at
    });
  }  

  async getById(id) {
    return await this.app.mysql.get('selfmedia_posts', {
      id: +id,
    });
  }

  async remove(id) {
    return await this.app.mysql.delete('selfmedia_posts', {
      id: +id,
    });
  }

  async list(page = 1) {
    const data = await this.app.mysql.select('selfmedia_posts', {
      offset: (page - 1) * 20,
      limit: 20,
    });
    data.forEach(item => {
      try {
        item.images = JSON.parse(item.images);
      } catch (e) {
        console.error(e);
      }
    });
    const total = await this.app.mysql.count('selfmedia_posts');
    return {
      list: data,
      total_count: +total,
      current_page: +page,
      total_pages: Math.ceil(total / 20),
    }
  }
}

module.exports = MediaService;