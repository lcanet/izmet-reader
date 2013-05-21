var cronJob = require('cron').CronJob,
    http = require('http'),
    config = require('../config/config.js'),
    url = require('url'),
    moment = require('moment'),
    rss = require('./poller_rss.js'),
    twitter = require('./poller_twitter.js');

var pollers = {
    'rss': rss.poll,
    'twitter': twitter.poll
};

function processFeeds(feeds) {
    var nbFeedProcessed = 0;
    for (var i = 0; i < feeds.length; i++) {
        if (shouldPollFeed(feeds[i])){

            var poller = pollers[feeds[i].type];
            if (poller) {
                poller(feeds[i]);
                nbFeedProcessed++;
            } else{
                console.log("Cannot find poller for feed type " + feeds[i].type);
            }

            markFeedUpdated(feeds[i]);
        }

        if (nbFeedProcessed > config.maxFeedsPerPoll){
            console.log("Stopping poll ... max feeds exceeded");
        }
    }
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
            var chunks = [];
            res.on("data", function(data){
                chunks.push(data);
            });
            res.on("end", function(){
                var resp = JSON.parse(chunks.toString());
                processFeeds(resp);
            });
        });
}

function startPoller() {
    new cronJob('00 */5 * * * *', doPoll).start();
    // poll on start, for debug
    doPoll();
}

exports.startPoller = startPoller;

