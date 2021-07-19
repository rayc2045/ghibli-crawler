# Ghibli Crawler

[![Photo](https://cdn.dribbble.com/users/3800131/screenshots/15188916/media/a8f595ba01dd40e9c9fcaf253c09c11f.png)](https://dribbble.com/raychangdesign)

### Usage

Install [Git](https://git-scm.com/) and [Node](https://nodejs.org/), then type in terminal:

    $ git clone https://github.com/rayc2045/ghibli-crawler
    $ cd ghibli-crawler
    $ sh download.sh

If you don't use [Brave browser](https://brave.com/), remember to change the `executablePath` in index.js to your Chromium browser file path, or directly replace the npm package "puppeteer-core" with "puppeteer" and remove the `executablePath` in index.js:

    $ npm i puppeteer

```js
// index.js
const puppeteer = require('puppeteer-core'); // Replace "puppeteer-core" with "puppeteer"

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', // Remove this line
```

Awhile after running `$ node index.js`, all photos will be saved in the "img" folder. (321.9 MB)

[![Photo](https://cdn.dribbble.com/users/3800131/screenshots/15188869/media/823b8d9b8055e21c18408aca4342ae60.png)](https://dribbble.com/raychangdesign)

### Dev Log

最近對爬蟲感到興趣，幾天的研究發現 [Puppeteer](https://github.com/puppeteer/puppeteer) 這套由 Google 開源、使用無介面操作 Chrome 做自動化測試的 Node.js 函式庫也能用來爬取資料，因此決定使用 Node.js 搭配 Puppeteer 和 [Axios](https://github.com/axios/axios) (基於 promise 的 HTTP 庫)，自動化將先前作品[「吉卜力相簿」](https://rayc2045.github.io/ghibli-gallery/) 上的一千多張作品劇照下載下來。

Puppeteer 可由 npm 進行安裝，如果電腦中有基於 Chromium 的瀏覽器，可下載容量較小的核心版本，之後再將啟動路徑設置為應用程式路徑即可 (範例使用 Brave 瀏覽器)：

    $ npm i puppeteer-core

```js
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
  });
})();
```

Puppeteer 的語法並不難，在[官方文件](https://pptr.dev/)中可找到許多範例；而其中因為大多自動化操作屬於非同步行為，需要另外使用 async/await 語法確保程式依序執行，算是比較需要注意的部分，較常用到的指令有：

```js
const page = await browser.newPage();

const cookies = await page.cookies([...urls]); // 獲取此頁 cookies
await page.setCookie(cookieObject1, cookieObject2); // 設定 cookie
await page.setUserAgent(userAgent); // 設定 userAgent

const navbar = await page.$('.nav'); // 抓取單一元素
const links = await page.$$('a'); // 抓取複數元素

const title = await page.evaluate(() => 
  document.querySelector('#title').textContent.trim()); // 取得 title

const imageLinks = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map(img => img.src)); // 取得圖片網址

await page.type('#email', 'example@gmail.com'); // 輸入
await page.click('.loginBtn'); // 點擊

// 單一元素截圖
const target = await page.$('img');
await target.screenshot({ path: `./img/example.png` });

// 整頁截圖
await page.screenshot({
  path: './img/screenshot.png',
  type: 'png',
  fullPage: true
  // clip: { x: 0, y: 0, width: 1920, height: 800 }
});

const url = await page.url(); // 當前網址
await page.reload(); // 重整頁面
await page.goBack(); // 上一頁
await page.goForward(); // 下一頁

await page.waitForNavigation(); // 等待頁面跳轉
await page.waitForSelector('.navSubmenu'); // 等待當前頁面 AJAX 元素

await page.waitForResponse(res =>
  res.url().match(encodeURIComponent(name)) && response.ok()); // 等待資料回應完成

await page.waitForFunction(() =>
  [...document.querySelectorAll('div[class="asset"]')].some(el =>
    el.textContent.includes('Assets Folder'))); // 等待功能完成
```

這次實作中遇到最大的問題是在大量下載圖片時，Node 端遇到的錯誤，原因由短時間內發出過多請求導致圖片下載失敗，透過加上 `slowMo` 參數，將自動化操作的速度減慢得以解決：

    (node:15319) UnhandledPromiseRejectionWarning: Error: getaddrinfo ENOTFOUND www.ghibli.jp
        at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:67:26)
    (Use `node --trace-warnings ...` to show where the warning was created)

```js
const browser = await puppeteer.launch({
  executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  slowMo: 1200
});
```

完成初次爬蟲和自動化程序的過程中小有成就感，如果未來有需求，也許還會使用類似的方式做網頁轉 PDF、自動化登入操作，又或是定時爬完資料後結合寄信功能做 Email 通知吧！

文章同步刊載於 [Medium](https://medium.com/@raychangdesign)。