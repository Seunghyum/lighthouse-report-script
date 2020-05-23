const chromeLauncher = require("chrome-launcher");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const config = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const reportGenerator = require("lighthouse/lighthouse-core/report/report-generator");
const request = require("request");
const util = require("util");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

(async () => {
  const {TARGET_URL, ID, PW} = process.env;

  const opts = {
    logLevel: "info",
    output: "json",
    disableDeviceEmulation: true,
    defaultViewport: {
      width: 1200,
      height: 900,
    },
    chromeFlags: ["--disable-mobile-emulation", "--incognito"],
  };

  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(opts);
  opts.port = chrome.port;

  // Connect to it using puppeteer.connect().
  const resp = await util.promisify(request)(
    `http://localhost:${opts.port}/json/version`
  );
  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  });

  //Puppeteer
  page = (await browser.pages())[0];
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(targetURL, {TARGET_URL;

  await page.click("a#login-open-btn");
  await page.type('input[name="j_username"]', ID);
  await page.type('input[name="j_password"]', PW);
  await page.click('form[data-ga-action="login"] button');

  // select and create room

  await page.waitForNavigation();
  let emptyRoomNum = 1;

  await page.waitForSelector(`.channel-item.offline`);
  for (let i = 1; i < 99; i++) {
    let checkRomm = await page.$(
      `.channel-item.offline:nth-child(${i}) button`
    );
    if (checkRomm) {
      emptyRoomNum = i;
      break;
    }
  }

  await page.click(`.channel-item.offline:nth-child(${emptyRoomNum}) button`);
  await page.type('.mode-video input[name="title"]', "test1");
  await page.click(".mode-video button");

  await page.waitForNavigation();

  console.log("page.url() : ", page.url());

  // Run Lighthouse.
  const report = await lighthouse(page.url(), opts, config).then((results) => {
    return results;
  });
  const html = reportGenerator.generateReport(report.lhr, "html");
  const json = reportGenerator.generateReport(report.lhr, "json");

  // console.log(`Lighthouse score: ${report.lhr.score}`);

  await browser.disconnect();
  await chrome.kill();

  //Write report html to the file
  const fileName = page.url().replace("https://", "").replace(/\//gi, "-");
  const dirPath = "./reports";
  fs.writeFile(`${dirPath}/${fileName}.html`, html, (err) => {
    if (err) {
      console.error(err);
    }
  });

  // //Write report json to the file
  // fs.writeFile(`${page.url()}.json`, json, (err) => {
  //   if (err) {
  //     console.error(err);
  //   }
  // });
})();
