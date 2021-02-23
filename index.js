const puppeteer = require('puppeteer-core');
const fs = require('fs');
const axios = require('axios');

(async () => {
  console.log('Connecting...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    args: [
      '--incognito', // 無痕模式
      '--window-size=800,800',
      // '--no-sandbox',
      // '--disable-setuid-sandbox'
    ],
    // headless: false, // Open browser
    // devtools: true,
    slowMo: 1200, // Prevent error: getaddrinfo ENOTFOUND www.ghibli.jp (https://www.google.com/search?ei=0J40YKLgFPLRmAXarargBw&q=axios+UnhandledPromiseRejectionWarning%3A+Error%3A+getaddrinfo+ENOTFOUND+at+GetAddrInfoReqWrap.onlookup+%5Bas+oncomplete%5D+%28dns.js%3A67%3A26%29&oq=axios+UnhandledPromiseRejectionWarning%3A+Error%3A+getaddrinfo+ENOTFOUND+at+GetAddrInfoReqWrap.onlookup+%5Bas+oncomplete%5D+%28dns.js%3A67%3A26%29&gs_lcp=Cgdnd3Mtd2l6EANQ3Q5YhhVg_RVoAHAAeACAAQCIAQCSAQCYAQKgAQGqAQdnd3Mtd2l6wAEB&sclient=gws-wiz&ved=0ahUKEwiiiLrirv_uAhXyKKYKHdqWCnwQ4dUDCA0&uact=5)
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36');
  await page.goto('https://rayc2045.github.io/ghibli-gallery/', {
    waitUntil: 'domcontentloaded'
  });

  const buttons = await page.$$('.catalog a');

  for (const button of buttons) {
    await button.click();
    await page.waitForSelector('section img');

    const folderName = await page.evaluate(() =>
      document.querySelector('#title').textContent.trim());

    const imageLinks = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map(img => img.src) // https://www.ghibli.jp/gallery/redturtle001.jpg
        .filter(link => !link.includes('rayc2045'))
    );

    createFolder('./img');
    createFolder(`./img/${folderName}`);
    console.log('Start downloading...');

    imageLinks.forEach(url => {
      const split = url.split('/');
      const imageName = split[split.length - 1]; // redturtle001.jpg

      downloadImage(url, `./img/${folderName}/${imageName}`, () => {
        console.log(`Download "${folderName}" ${imageName}`);
      });
    });
  }

  await browser.close();
})();

function waitSeconds(sec) {
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