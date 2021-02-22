const puppeteer = require('puppeteer-core');
const fs = require('fs');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    args: [
      '--incognito', // 無痕模式
      // '--no-sandbox',
      // 'disable-setuid-sandbox',
      '--window-size=800,800'
    ],
    // headless: false, // Open browser
    slowMo: 100
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36');
  // page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1})
  await page.goto('https://rayc2045.github.io/ghibli-gallery/', {
    waitUntil: 'domcontentloaded'
  });
  await wait(5);

  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.catalog a')]);

  for (const i in buttons) {
    // 點擊按鈕，等待
    await page.evaluate(() =>
      [...document.querySelectorAll('.catalog a')][i].click());

    // Get the height of the rendered page
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    // Scroll one viewport at a time, pausing to let content load
    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;

    while (viewportIncr + viewportHeight < height) {
      await page.evaluate(_viewportHeight => {
        window.scrollBy(0, _viewportHeight);
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
      document.querySelector('#title').textContent.trim());

    const imageLinks = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map(img => img.src) // https://www.ghibli.jp/gallery/redturtle001.jpg
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
  }

  await browser.close();
})();

function wait(sec) {
  return new Promise(resolve => setTimeout(() => resolve()), sec * 1000);
}

function createFolder(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
}

async function downloadImage(url, path, callback) {
  const writer = fs.createWriteStream(path);

  const response = await axios({
    url,
    methods: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}