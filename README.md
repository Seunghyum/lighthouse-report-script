# lighthouse-report-script

for print lighthouse report in web service. (example : [Remote Meeting](https://www.remotemeeting.com))

# menual

## just print html file 

1. install dependencies ```npm install``` or ```yarn```

2. set ```.env``` file in root

```SHELL
NODE_ENV=development
TARGET_URL=https://www.remotemeeting.com # set your target url
ID=<write your Remote Meeting ID>
PW=<write your Remote Meeting Password>
```

3. just run yarn report

4. check out ```./reports``` folder :)

## slack alert & print html file 

1. install dependencies ```npm install``` or ```yarn```

2. set ```.env``` file in root

```SHELL
NODE_ENV=development
TARGET_URL=https://www.remotemeeting.com # set your target url
ID=<write your Remote Meeting ID>
PW=<write your Remote Meeting Password>
MY_SLACK_WEBHOOK_URL=<write your Slack Webhook URL>
```

3. just run yarn slack

4. customize my code

```javascript
...
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
          footer: `Lighthouse Tests | ${reportName}`,
          footer_icon:
            "https://platform.slack-edge.com/img/default_application_icon.png",
        },
      ],
    });
...
```

5. check out ```./reports``` folder and slack channel :)
