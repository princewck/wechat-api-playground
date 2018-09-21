# wechat-push



## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org

# 一些约定
### 1. 配置文件
配置文件路径 /usr/local/opt/wechat-api/config.json
```
{
  'appid': '[微信appid]',
  'appsecret': '[微信appsecret]]'
}
```