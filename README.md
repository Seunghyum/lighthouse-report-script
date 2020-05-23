# lighthouse-report-script

for print lighthouse report in web service. (example : [Remote Meeting](https://www.remotemeeting.com))

# menual

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