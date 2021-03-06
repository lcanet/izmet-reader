var cronJob = require('cron').CronJob,
    http = require('http'),
    config = require('../config/config.js'),
    url = require('url'),
    moment = require('moment'),
    rss = require('./poller_rss.js'),
    und = require('underscore'),
    utils = require('../utils/utils.js'),
    twitter = require('./poller_twitter.js'),
    dilbert = require('./poller_dilbert.js'),
    auth = require('../utils/auth.js');

var pollers = {
    'rss': rss.poll,
    'twitter': twitter.poll,
    'dilbert': dilbert.poll
};

// set of currently polling feeds
var currentlyPolling = {};

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function processFeeds(feeds, limit) {

    feeds =shuffle(feeds);
    // filter feeds
    var feedsToProcess = und.filter(feeds, shouldPollFeed);
    if (limit > 0) {
        feedsToProcess = feedsToProcess.slice(0, Math.min(feedsToProcess.length, limit));
    }
    console.log("Processing " + feedsToProcess.length + "/" + feeds.length + " feeds");
    console.log("Backlog of bad feeds is ", currentlyPolling);

    // mark feeds
    for (var i = 0; i < feedsToProcess.length; i++) {
        currentlyPolling[feedsToProcess[i].id] = true;
    }


    utils.processQueue(feedsToProcess, function(nextFeed, done){
        pollFeed(nextFeed, done);
    }, function(){
        console.log('Polling done.');
    });
}

function pollFeed(feed, callback) {
    var poller = pollers[feed.type];
    if (poller) {
        markFeedUpdated(feed);
        poller(feed, callback);
    } else{
        console.log("Cannot find poller for feed type " + feed.type);
        callback('Cannot find poller');
    }
}

function shouldPollFeed(feed) {
    if (feed.last_poll == null) {
        return true;
    }
    // currently polling by another thread ?
    if (currentlyPolling[feed.id]){
        return false;
    }
    var nextPoll = moment(feed.last_poll).add('minutes', feed.poll_frequency);
    return nextPoll.isBefore(moment());
}

function markFeedUpdated(feed){
    delete currentlyPolling[feed.id];

    var feedData = {
        last_poll: moment().format()
    };

    var opts = url.parse(config.apiLocalUrl + '/feed/' + feed.id);
    opts.method = 'PUT';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    auth.addBasicAuth(opts.headers);
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
function doPoll(limit) {
    if (!config.pollerEnabled) {
        return;
    }

    // poll rest pi
    var opts = url.parse(config.apiLocalUrl + '/feed/');
    opts.method = 'GET';
    opts.headers = {
        "Accept": "application/json"
    };
    auth.addBasicAuth(opts.headers);
    var req = http.request(opts,
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
                processFeeds(resp, limit);
            });
        });
    req.end();
}

function pollAllFeeds() {
    doPoll(0);
}

function cronPollHandler() {
    doPoll(config.maxFeedsPerPoll);
}

function startPoller(devMode) {
    new cronJob('00 */5 * * * *', cronPollHandler).start();
    // poll on start, for debug
    if (devMode){
        // doPoll(config.maxFeedsPerPoll);
    }
}

exports.startPoller = startPoller;
exports.pollAllFeeds = pollAllFeeds;
exports.pollFeed = pollFeed;
