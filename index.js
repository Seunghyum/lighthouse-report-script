const fs = require("fs");
const path = require("path");
const async = require("async");
const exec = require("child_process").exec;

// make reports folder if not exists
const reportDir = "./reports";

if (!fs.existsSync(reportDir)){
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

// run lighthouse reports scripts
const scriptsFolder = "./src/"; // add your scripts to folder named scripts

const files = fs.readdirSync(scriptsFolder); // reading files from folders
const funcs = files.map(function (file) {
  return exec.bind(null, `node ${scriptsFolder}${file} NODE_ENV=development`); // execute node command
});

function getResults(err, data) {
  if (err) {
    return console.log(err);
  }
  const results = data.map(function (lines) {
    return lines.join(""); // joining each script lines
  });
  console.log(results);
}

// // to run your scipts in parallel use
// async.parallel(funcs, getResults);

// to run your scipts in series use
async.series(funcs, getResults);
