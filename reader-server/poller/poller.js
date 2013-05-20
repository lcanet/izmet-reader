var cronJob = require('cron').CronJob,
    http = require('http'),
    config = require('../config/config.js'),
    FeedParser  = require('feedparser'),
    request = require('request'),
    url = require('url'),
    moment = require('moment');

var pollers = {
    'rss': pollFeedRSS
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

function pollFeedRSS(feed) {
    console.log("Polling feed " + feed.name);
    request(feed.url)
        .pipe(new FeedParser({feedurl: feed.url}))
        .on('error', function(err) {
            console.log("Error polling feed " + feed.name, err);
        })
        .on('article', function(article){
            processFeedArticle(feed, article);
        })
        ;
}

function processFeedArticle(feed, article) {
    // push the article
    var articleData = {
        article_date: article.date.getTime(),
        fetch_date: new Date().getTime(),
        content: article.description,
        url: article.link,
        title: article.summary,
        article_id: null
    };

    // create http request for posting article
    // backend will check if article doesn't already exists
    var opts = url.parse(config.apiUrl + '/feed/' + feed.id + '/article');
    opts.method = 'POST';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    var req = http.request(opts, function(res){
        // not
        if (res.statusCode != 201 && res.statusCode != 304) {
            console.log("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            return;
        }
        var chunks = [];
        res.on("data", function(data){
            chunks.push(data);
        });
        res.on("end", function(){
            // fin ...
        });
    });

    req.write(JSON.stringify(articleData));
    req.write("\n");
    req.end();
}

function markFeedUpdated(feed){
    var feedData = {
        last_poll: new Date().getTime()
    };

    var opts = url.parse(config.apiUrl + '/feed/' + feed.id);
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
    http.get(config.apiUrl + '/feed',
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
    new cronJob('00 * * * * *', doPoll).start();
    // poll on start, for debug
    doPoll();
}

exports.startPoller = startPoller;
exports.startPoller = startPoller;

