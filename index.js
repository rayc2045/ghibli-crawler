const puppeteer = require('puppeteer-core');
const fs = require('fs');
const request = require('request');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    args: [
      // '--incognito', // 無痕模式
      // '--no-sandbox',
      // 'disable-setuid-sandbox',
      '--window-size=800,800'
    ],
    headless: false, // Open browser
    slowMo: 100
  });

  const page = await browser.newPage();
  // page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1})
  await page.goto('https://rayc2045.github.io/ghibli-gallery/', {
    waitUntil: 'domcontentloaded'
  });
  await wait(5);

  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.catalog a')]);

  // for (const i in buttons) {
    // 點擊按鈕，等待
    await page.evaluate(() =>
      [...document.querySelectorAll('.catalog a')][0].click());

    // Get the height of the rendered page
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    // Scroll one viewport at a time, pausing to let content load
    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;

    while (viewportIncr + viewportHeight < height) {
      await page.evaluate(_viewportHeight => {
        window.scrollBy(0, _viewportHeight)
      }, viewportHeight);
      await wait(0.02);
      viewportIncr += viewportHeight;
    }
    // Scroll back to top
    await page.evaluate(_ => window.scrollTo(0, 0));
    // Extra delay to let images load
    await wait(1);

    // Make folder and download images
    const folderName = await page.evaluate(() =>
      document.querySelector('#title').textContent);

    const imageLinks = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map(img => img.src)
        .filter(link => !link.includes('rayc2045'))
    );

    createFolder('./img');
    createFolder(`./img/${folderName}`);

    imageLinks.forEach((src, idx) => {
      // const url = {
      //   host: 'www.ghibli.jp',
      //   path: `/${src.replace(`https://www.ghibli.jp/`, '')}`
      // }
      const split = src.split('/');
      const imageName = split[split.length - 1]; // redturtle001.jpg
      
      downloadImage(src, `./img/${folderName}/${imageName}`, () => {
        console.log(`Download "${folderName}" ${imageName}`);
      });
    });
  // }

  // await browser.close();
})();

function wait(sec) {
  return new Promise(resolve => setTimeout(() => resolve()), sec * 1000)
}

function createFolder(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
}

function downloadImage(url, path, callback) {
  request.head(url, (err, res, body) => {
    // console.log(`content-type: ${res.headers['content-type']}`);
    // console.log(`content-length: ${res.headers['content-length']}`);
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback);
  });
}