const assert = require('assert');
const fs = require('fs');
const childProcess = require('child_process');
const FileLogger = require('./file-logger');

const findLogFiles = () => fs.readdirSync('.').filter(filename =>
  (filename.startsWith('log') || filename.startsWith('weekend'))
  && filename.endsWith('.txt')
);

const deleteLogFiles = () => {
  const logFiles = findLogFiles();
  logFiles.forEach(filename => fs.rmSync(`${__dirname}/${filename}`));
};

const realDateNow = Date.now.bind(global.Date);
const mockDateNow = number => {
  global.Date.now = () => number;
}
const restoreDateNow = () => {
  global.Date.now = realDateNow;
}

const tests = [
  {
    test: () => new FileLogger().Log('message'),
  },
  {
    test: () => {
      new FileLogger().Log('message'),
      assert(findLogFiles().length);
    },
  },
  {
    test: () => {
      const message = 'should be appended';
      new FileLogger().Log(message);
      const logFile = findLogFiles()[0];
      const fileContents = fs.readFileSync(logFile, { encoding: 'utf-8' });
      assert(fileContents.endsWith(message));
    },
  },
  {
    test: () => {
      mockDateNow(1629724415000);
      new FileLogger().Log('should be in a dated file');
      const fileContents = fs.readFileSync('./log20210823.txt', { encoding: 'utf-8' });
      assert(fileContents.endsWith('2021-08-23 13:13:35 should be in a dated file'));
    },
  },
  {
    test: () => {
      mockDateNow(1629724415000);
      new FileLogger().Log('should have date before it');
      const fileContents = fs.readFileSync('./log20210823.txt', { encoding: 'utf-8' });
      assert(fileContents.endsWith('2021-08-23 13:13:35 should have date before it'));
    },
  },
  {
    test: () => {
      mockDateNow(1629724415000);
      const fileLogger = new FileLogger();
      fileLogger.Log('log on day 1');
      assert.strictEqual(findLogFiles().length, 1);
      mockDateNow(1629810815000);
      fileLogger.Log('log on day 1');
      assert.strictEqual(findLogFiles().length, 2);
    },
  },
  {
    test: () => {
      const saturday = 1629551615000;
      mockDateNow(saturday);
      const fileLogger = new FileLogger();
      fileLogger.Log('log on saturday');
      const fileContents = fs.readFileSync('weekend.txt', { encoding: 'utf-8' });
      assert(fileContents.endsWith('log on saturday'));
    },
  },
  {
    test: () => {
      const sunday = 1629638015000;
      mockDateNow(sunday);
      const fileLogger = new FileLogger();
      fileLogger.Log('log on sunday');
      const fileContents = fs.readFileSync('weekend.txt', { encoding: 'utf-8' });
      assert(fileContents.endsWith('log on sunday'));
    },
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sat 21 Aug 2021 UTC' weekend.txt");
      
      const sunday22ndAugust = 1629638015000;
      const fileLogger = new FileLogger();
      mockDateNow(sunday22ndAugust);
      fileLogger.Log('log on sunday');

      const files = findLogFiles();
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0], 'weekend.txt');
    },
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sat 28 Feb 2004 UTC' weekend.txt");
      
      const fileLogger = new FileLogger();
      const laterSaturday = 1629551615000;

      mockDateNow(laterSaturday);
      fileLogger.Log('log on later saturday');

      files = findLogFiles();
      assert.strictEqual(files.length, 2);
      assert(files.includes('weekend-20040228.txt'));
      assert(files.includes('weekend.txt'));
      
      const newFileContents = fs.readFileSync('./weekend.txt', { encoding: 'utf-8' });
      assert(newFileContents.endsWith('2021-08-21 13:13:35 log on later saturday'));
    },
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sun 29 Feb 2004 UTC' weekend.txt");
      
      const fileLogger = new FileLogger();
      const laterSaturday = 1629551615000;

      mockDateNow(laterSaturday);
      fileLogger.Log('log on later saturday');

      files = findLogFiles();
      assert.strictEqual(files.length, 2);
      assert(files.includes('weekend-20040228.txt'));
      assert(files.includes('weekend.txt'));
      
      const newFileContents = fs.readFileSync('./weekend.txt', { encoding: 'utf-8' });
      assert(newFileContents.endsWith('2021-08-21 13:13:35 log on later saturday'));
    },
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sun 01 Aug 2021 UTC' weekend.txt");
      
      const fileLogger = new FileLogger();
      const laterSaturday = 1628294400000;

      mockDateNow(laterSaturday);
      fileLogger.Log('log on later saturday');

      files = findLogFiles();
      assert.strictEqual(files.length, 2);
      assert(files.includes('weekend-20210731.txt'));
      assert(files.includes('weekend.txt'));
      
      const newFileContents = fs.readFileSync('./weekend.txt', { encoding: 'utf-8' });
      assert(newFileContents.endsWith('2021-08-07 00:00:00 log on later saturday'));
    },
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sat 31 Jul 2021 UTC' weekend.txt");
      
      const sunday1August = 1627776000000;
      const fileLogger = new FileLogger();
      mockDateNow(sunday1August);
      fileLogger.Log('log on sunday');

      const files = findLogFiles();
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0], 'weekend.txt');
    }
  },
  {
    test: () => {
      childProcess.execSync("touch -d 'Sat 31 Jul 2021 UTC' weekend.txt");
      
      const sunday1AugustLastMs = 1627862399999;
      const fileLogger = new FileLogger();
      mockDateNow(sunday1AugustLastMs);
      fileLogger.Log('log on sunday');

      const files = findLogFiles();
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0], 'weekend.txt');
    }
  },
];

let testsToRun = tests.filter(({ skip }) => !skip);
const testsWithOnly = testsToRun.filter(({ only }) => only);
testsToRun = testsWithOnly.length ? testsWithOnly : testsToRun;

console.log(`Running ${testsToRun.length} tests`);
let passed = 0;
const failures = [];
for (const { test } of testsToRun) {
  console.log(`Running test number ${passed + 1}`);
  try {
    test();
    passed++;
  } catch (err) {
    failures.push(err);
    break;
  } finally {
    restoreDateNow();
    deleteLogFiles();
  }
}

console.log(`${passed} passed`)

if (failures.length) {
  console.log(`${failures.length} failures`);
  console.log(failures);
}
