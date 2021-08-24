const fs = require('fs');

class FileLogger {
  _parseDate(date) {
    const oneIndexMonth = date.getUTCMonth() + 1;
    const day = date.getUTCDay();
    const dayOfMonth = date.getUTCDate();
    const getDoubleDigitFormat = (number) => `${number < 10 ? '0' : ''}${number}`

    return {
      year: date.getUTCFullYear(),
      month: getDoubleDigitFormat(oneIndexMonth),
      dayOfMonth: getDoubleDigitFormat(dayOfMonth),
      hour: getDoubleDigitFormat(date.getUTCHours()),
      minute: getDoubleDigitFormat(date.getUTCMinutes()),
      seconds: getDoubleDigitFormat(date.getUTCSeconds()),
      isSunday: day === 0,
      isWeekend: [0,  6].includes(day),
    }
  }

  _getLogDateString(date) {
    return `${date.year}-${date.month}-${date.dayOfMonth} ${date.hour}:${date.minute}:${date.seconds}`;
  }

  _getLogFilePath(date) {
    if (date.isWeekend) return `${__dirname}/weekend.txt`;
    return `${__dirname}/log${date.year}${date.month}${date.dayOfMonth}.txt`;
  }

  _getOldWeekendFileNameDateString(weekendFileModifiedTime) {
    let parsedDate = this._parseDate(weekendFileModifiedTime);
    if (parsedDate.isSunday) {
      const dateToUse = new Date(weekendFileModifiedTime);
      dateToUse.setDate(dateToUse.getDate() - 1);
      parsedDate = this._parseDate(dateToUse);
    }
    const { year, month, dayOfMonth } = parsedDate;
    return `weekend-${year}${month}${dayOfMonth}.txt`;
  }

  _datesAreLessThanTwoDaysApart(earlierDate, laterDate) {
    const twoDaysMs = 172800000;
    return (laterDate - earlierDate) <= twoDaysMs;
  }

  _maybeRenameOldWeekendFile(currentDate) {
    if (!fs.existsSync('weekend.txt')) return;

    const weekendFileModifiedTime = fs.statSync('weekend.txt').mtime;
    if (this._datesAreLessThanTwoDaysApart(weekendFileModifiedTime, currentDate)) return;

    fs.renameSync('weekend.txt', this._getOldWeekendFileNameDateString(weekendFileModifiedTime));
  }

  Log(message) {
    const date = new Date(Date.now());
    const parsedDate = this._parseDate(date);
    if (parsedDate.isWeekend) {
      this._maybeRenameOldWeekendFile(date);
    }
    const filePath = this._getLogFilePath(parsedDate);
    const dateString = this._getLogDateString(parsedDate);
    fs.appendFileSync(filePath, `${dateString} ${message}`);
  }
}

module.exports = FileLogger;
