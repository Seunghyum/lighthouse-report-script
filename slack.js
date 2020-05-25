const chromeLauncher = require("chrome-launcher");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const config = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const reportGenerator = require("lighthouse/lighthouse-core/report/report-generator");
const request = require("request");
const util = require("util");
const path = require("path");
const fs = require("fs");

let scoresBelowBaseline = false;
let assert = require("assert");
const dotenv = require("dotenv");
dotenv.config();

// make reports folder if not exists
const reportDir = "./reports";

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir);
}

// reset "./reports" directory
fs.readdir(reportDir, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(reportDir, file), (err) => {
      if (err) throw err;
    });
  }
});

const { TARGET_URL, ID, PW, MY_SLACK_WEBHOOK_URL } = process.env;
let slack = require("slack-notify")(MY_SLACK_WEBHOOK_URL);
const app_name = "Remote Meeting";

(async () => {
  const opts = {
    //chromeFlags: ['--headless'],
    logLevel: "info",
    output: "json",
    disableStorageReset: true, // 로그인 정보 유지
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

  // goto home page
  page = (await browser.pages())[0];
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });
  await runLighthouseForURL(page.url(), opts, "report name");

  // login process
  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });
  //// login
  await page.click("a#login-open-btn");
  await page.type('input[name="j_username"]', ID);
  await page.type('input[name="j_password"]', PW);
  await page.click('form[data-ga-action="login"] button');

  //// goto history page
  await page.waitForSelector('a[href="/lounge/history"]');
  await page.click('a[href="/lounge/history"]');
  await runLighthouseForURL(page.url(), opts, "report name");

  // goto schedule page
  await page.waitForSelector('a[href="/lounge/schedule"]');
  await page.click('a[href="/lounge/schedule"]');
  await page.waitForSelector("#schedule");
  await runLighthouseForURL(page.url(), opts, "report name");

  console.log("page.url() : ", page.url());

  await browser.disconnect();
  await chrome.kill();

  try {
    assert.equal(
      scoresBelowBaseline,
      false,
      "One of the scores was found below baseline. Failing test"
    );
  } catch (error) {
    console.error(
      "Failing Test: One of the scores was found below baseline. Failing test"
    );
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function runLighthouseForURL(pageURL, opts, reportName) {
  // const reportNameForFile = reportName.replace(/\s/g, "");

  let scores = {
    Performance: 0,
    Accessibility: 0,
    "Best Practices": 0,
    SEO: 0,
  };
  let slackArray = [];

  const report = await lighthouse(pageURL, opts, config).then((results) => {
    return results;
  });
  const html = reportGenerator.generateReport(report.lhr, "html");
  const json = reportGenerator.generateReport(report.lhr, "json");
  scores.Performance = JSON.parse(json).categories.performance.score;
  scores.Accessibility = JSON.parse(json).categories.accessibility.score;
  scores["Best Practices"] = JSON.parse(json)["categories"]["best-practices"][
    "score"
  ];
  scores.SEO = JSON.parse(json).categories.seo.score;

  let baselineScores = {
    Performance: 0.8,
    Accessibility: 0.8,
    "Best Practices": 0.8,
    SEO: 0.8,
  };

  //Write report html to the file
  const fileName = pageURL.replace("https://", "").replace(/\//gi, "-");
  const dirPath = "./reports";
  fs.writeFile(`${dirPath}/${fileName}.html`, html, (err) => {
    if (err) {
      console.error(err);
    }
  });

  let BreakException = {};
  let SlackHeadline = "Default Headline";

  try {
    Object.keys(baselineScores).forEach((key) => {
      let baselineValue = baselineScores[key];
      console.log(scores);

      if (scores[key] != null && baselineValue > scores[key]) {
        Object.keys(baselineScores).forEach((key) => {
          const scorePercent = scores[key] * 100;
          slackArray.push({
            title: `${key}`,
            value: `${scorePercent}%`,
            short: true,
          });
        });
        console.log("slackArray : ", slackArray);
        console.log("key : ", key);
        console.log("scores[key] : ", scores[key]);
        console.log("baselineValue : ", baselineValue);
        console.log(
          `${app_name}: ` +
            key +
            " score " +
            scores[key] * 100 +
            "% for " +
            fileName +
            " is less than the defined baseline of " +
            baselineValue * 100 +
            "%"
        );
        SlackHeadline =
          `*${app_name}:* _` +
          key +
          `_ score for <${pageURL}|` +
          fileName +
          "> below " +
          baselineValue * 100 +
          "%";
        console.log("SlackHeadline : ", SlackHeadline);
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  if (slackArray.length) {
    slack.alert({
      channel: "lighthouse",
      attachments: [
        {
          author_name: "Lighthouse Cat",
          author_icon:
            "https://stickershop.line-scdn.net/stickershop/v1/product/1469342/LINEStorePC/main.png;compress=true",
          thumb_url:
            "https://stickershop.line-scdn.net/stickershop/v1/product/1469342/LINEStorePC/main.png;compress=true",
          pretext: `${SlackHeadline}`,
          fallback: "Nothing to show here",
          color: "#ffdb8e",
          fields: slackArray,
          footer: `Lighthouse Tests | ${fileName}`,
          footer_icon:
            "https://platform.slack-edge.com/img/default_application_icon.png",
        },
      ],
    });
    scoresBelowBaseline = true;
    console.log("Slack alert sent coz scores below baseline");
  }
}
