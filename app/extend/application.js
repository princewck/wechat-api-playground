const redis = require('redis');

let _client;

function getClient(app) {
  if (!_client) {
    _client = redis.createClient(app.config.redis.client);
  } 
  return _client;
}

module.exports = {
  getRedisClient() {
    const app = this;
    const client = getClient(app);
    const prefix = app.config.redis.prefix;
    return {
      set(key, value) {
        const fullkey = `${prefix}${key}`;
        const seralized = JSON.stringify(value);
        const ttl = app.config.redis.ttl;
        const promiseCreate = new Promise((resolve, reject) => {
          client.set(fullkey, seralized, (error, reply) => {
            if (error) {
              reject(error);
            } else {
              resolve(reply)
            }
          });
        });
        const promiseExpire = new Promise((resolve, reject) => {
          client.expire(fullkey, ttl, (error, reply) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(reply);
          });
        });
        return Promise.all([promiseCreate, promiseExpire]);
      },
      get(key) {
        const app = this;
        const client = getClient(app);
        const fullkey = `${prefix}${key}`;
        return new Promise((resolve, reject) => {
          client.get(fullkey, (error, reply) => {
            if (error) {
              return reject(error);
            }
            try {
              const result = JSON.parse(reply);
              resolve(result);
            } catch (e) {
              reject(e);
            }
          });
        });    
      },
      del(key) {
        const app = this;
        const fullkey = `${prefix}${key}`;
        const client = getClient(app);
        return new Promise((resolve, reject) => {
          client.del(fullkey, (error, reply) => {
            if (error) {
              return reject(error);
            }
            console.error(`${key} => 删除缓存`);
            resolve(reply);
          })
        });
      },
      keys(pattern) {
        const app = this;
        const client = getClient(app);
        return new Promise((resolve, reject) => {
          client.send_command('scan', [0, 'MATCH', `${prefix}${pattern}`], (error, reply) => {
            if (error) {
              return reject(error);
            }
            this.logger.info('reply', reply);
            resolve(reply[1]);
          })
        });              
      }
    };
  }
}