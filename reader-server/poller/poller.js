var cronJob = require('cron').CronJob,
    http = require('http'),
    config = require('../config/config.js'),
    url = require('url'),
    moment = require('moment'),
    rss = require('./poller_rss.js'),
    und = require('underscore'),
    utils = require('../utils/utils.js'),
    twitter = require('./poller_twitter.js');

var pollers = {
    'rss': rss.poll,
    'twitter': twitter.poll
};

function processFeeds(feeds) {

    // filter feeds
    var feedsToProcess = und.filter(feeds, shouldPollFeed);
    feedsToProcess = feedsToProcess.slice(0, Math.min(feedsToProcess.length, config.maxFeedsPerPoll));

    utils.processQueue(feedsToProcess, function(nextFeed, done){
        var poller = pollers[nextFeed.type];
        if (poller) {
            markFeedUpdated(nextFeed);
            poller(nextFeed, done);
        } else{
            console.log("Cannot find poller for feed type " + nextFeed.type);
            done();
        }
    }, function(){
        console.log('Polling done.');
    });
}

function shouldPollFeed(feed) {
    if (feed.last_poll == null) {
        return true;
    }
    var nextPoll = moment(feed.last_poll).add('minutes', feed.poll_frequency);
    return nextPoll.isBefore(moment());
}

function markFeedUpdated(feed){
    var feedData = {
        last_poll: new Date().getTime()
    };

    var opts = url.parse(config.apiLocalUrl + '/feed/' + feed.id);
    opts.method = 'PUT';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    var req = http.request(opts, function(res){
        // not
        if (res.statusCode != 200) {
            console.log("Error updating feed (" + http.STATUS_CODES[res.statusCode] + ")");
            return;
        }
        res.on("end", function(){
            // fin ...
        });
    });

    req.write(JSON.stringify(feedData));
    req.write("\n");
    req.end();

}

function doPoll() {

    // poll rest pi
    http.get(config.apiLocalUrl + '/feed',
        function(res) {
            if (res.statusCode != 200) {
                console.log("Error polling rest API (" + http.STATUS_CODES[res.statusCode]);
                return;
            }
            var chunks = "";
            res.on("data", function(data){
                chunks += data;
            });
            res.on("end", function(){
                var resp = JSON.parse(chunks.toString());
                processFeeds(resp);
            });
        });
}

function startPoller(devMode) {
    new cronJob('00 */5 * * * *', doPoll).start();
    // poll on start, for debug
    if (devMode){
        doPoll();
    }
}

exports.startPoller = startPoller;

