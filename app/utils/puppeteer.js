/**
 * 文档
 * https://zhaoqize.github.io/puppeteer-api-zh_CN/#?product=Puppeteer&version=v1.17.0&show=api-pagewaitfornavigationoptions
 */

const path = require('path');
const puppeteerResolver = require("puppeteer-chromium-resolver");
const fs = require('fs');

async function createBrowser(options = {}) {
  const revisionInfo = await puppeteerResolver({
    revision: "",
    detectionPath: "",
    folderName: '.chromium-browser-snapshots',
    hosts: ["https://npm.taobao.org/mirrors", "https://storage.googleapis.com"],
    retry: 3
  });
  const { puppeteer, executablePath } = revisionInfo;
  const browser = await puppeteer.launch({
    headless: false,
    executablePath,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-features=site-per-process', // 解决获取不到iframe的问题
    ],
    ...options.launch_options,
  });  
  return browser;
}

async function restoreCookies(key, page) {
  const cookies_cache_path = path.resolve(__dirname, '../.cookies');
  try {
    const serializedCookies = fs.readFileSync(`${cookies_cache_path}_${key}`);
    const cookies = JSON.parse(serializedCookies);
    await page.setCookie(...cookies);
  } catch (e) {
    console.log('没有可用的历史cookie');
    return;
  }
}

function cacheCookies(key, cookies) {
  const cookies_cache_path = path.resolve(__dirname, '../.cookies');
  fs.writeFileSync(`${cookies_cache_path}_${key}`, JSON.stringify(cookies));
}


module.exports = {
  createBrowser,
  restoreCookies,
  cacheCookies,
}