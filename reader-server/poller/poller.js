var cronJob = require('cron').CronJob;


function doPoll() {
    console.log("Polling");
    // TODO: fetch feeds using rest api
    // for all feeds
    //  if feed is not polled of feed was polled before timeout
    //   poll feed
    //   for all articles
    //     submit articles
    //   end for
    //  end if
    //  if more than 10 feeds were polled in this iteration stop
}

function startPoller() {
    new cronJob('00 * * * * *', doPoll).start();
}

exports.startPoller = startPoller;
exports.startPoller = startPoller;

