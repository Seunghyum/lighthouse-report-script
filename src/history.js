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
  const { TARGET_URL, ID, PW } = process.env;

  const opts = {
    logLevel: "info",
    output: "json",
    disableStorageReset: true, // 로그인 정보 유지
    chromeFlags: ["--disable-mobile-emulation"],
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
  const page = (await browser.pages())[0];
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

  await page.click("a#login-open-btn");
  await page.type('input[name="j_username"]', ID);
  await page.type('input[name="j_password"]', PW);
  await page.click('form[data-ga-action="login"] button');

  // goto history page
  await page.waitForSelector('a[href="/lounge/history"]');
  await page.click('a[href="/lounge/history"]');
  await page.waitForSelector("#history-list");
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
