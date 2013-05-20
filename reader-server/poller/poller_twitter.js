var
    http = require('http'),
    https = require('https'),
    config = require('../config/config.js'),
    url = require('url'),
    moment = require('moment');

function pollFeedTwitter(feed) {
    console.log("Polling twitter feed " + feed.name);
    // use url as screen name
    var opts = url.parse('https://api.twitter.com/1/statuses/user_timeline.json?include_entities=false&include_rts=true&count=50&screen_name=' + feed.url);
    opts.method = 'GET';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    var req = https.request(opts,
        function(res){
            if (res.statusCode != 200){
                console.log("Error polling twitter (code " + http.STATUS_CODES[res.statusCode] + ")");
                return;
            }
            var chunks = "";
            res.on("data", function(data){
                chunks += data;
            });
            res.on("end", function(){
                var body = JSON.parse(chunks.toString());
                processTweets(feed, body);
            });
        }
    );
    req.end();
}

function processTweets(feed, tweets) {
    var proceedNext = function() {
        if (tweets.length > 0) {
            processTweet(feed, tweets.shift(), proceedNext);
        }
    };
    proceedNext();
}



function processTweet(feed, tweet, endCallback) {
    // push the article
    var articleData = {
        article_date: new Date(tweet.created_at).getTime(),
        fetch_date: new Date().getTime(),
        content: tweet.text,
        url: 'http://twitter.com/' + feed.url,
        title: tweet.text,
        article_id: tweet.id_str
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
            endCallback();
            return;
        }
        var chunks = [];
        res.on("data", function(data){
            chunks.push(data);
        });
        res.on("end", function(){
            // fin ...
            if (endCallback){
                endCallback();
            }
        });
    });

    req.write(JSON.stringify(articleData));
    req.write("\n");
    req.end();
}

exports.poll = pollFeedTwitter;

