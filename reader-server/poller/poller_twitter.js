var
    http = require('http'),
    https = require('https'),
    config = require('../config/config.js'),
    url = require('url'),
    moment = require('moment'),
    und = require('underscore'),
    auth = require('../utils/auth.js');

var cachedToken = null;


function withToken(callback) {
    if (cachedToken != null) {
        callback(null, cachedToken);
    } else {
        var key = config.twitter.key;
        var secret = config.twitter.secret;
        if (!key || !secret) {
            console.log("No twitter secret, aborting");
            callback('No twitter secret defined', null);
            return;
        }

        var enc  = new Buffer(key + ":" + secret).toString('base64');

        console.log("Getting twitter token for " + enc);

        var opts = {
            host: 'api.twitter.com',
            //host: '192.168.0.2',
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + enc
            }
        };

        var req = https.request(opts, function(res){
            if (res.statusCode != 200){
                console.log("Error getting oauth2 token (code " + res.statusCode + ")");
                callback("Error getting oauth2 token (code " + res.statusCode + ")", null);
            } else {
                var chunks = "";
                res.on("data", function(data){
                    chunks += data;
                });
                res.on("end", function(){
                    var body = JSON.parse(chunks.toString());
                    console.log("Got twitter auth response ", body);
                    cachedToken = body.access_token;
                    callback(null, cachedToken);
                });
            }
        });
        req.write('grant_type=client_credentials');
        req.end();
    }
}

function pollFeedTwitter(feed, callback) {
    withToken(function(err, token){
        if (err) {
            callback(err);
        }

        // use url as screen name
        var opts = url.parse('https://api.twitter.com/1.1/statuses/user_timeline.json?include_entities=true&include_rts=true&count=50&screen_name=' + feed.url);
        opts.method = 'GET';
        opts.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        };
        var req = https.request(opts,
            function(res){
                if (res.statusCode != 200){
                    console.log("Error polling twitter (code " + http.STATUS_CODES[res.statusCode] + ")");
                    callback("Error polling twitter (code " + http.STATUS_CODES[res.statusCode] + ")");
                    return;
                }
                var chunks = "";
                res.on("data", function(data){
                    chunks += data;
                });
                res.on("end", function(){
                    var body = JSON.parse(chunks.toString());
                    processTweets(feed, body, callback);
                });
            }
        );
        req.end();
    });

    console.log("Polling twitter feed " + feed.name);
}

function processTweets(feed, tweets, callback) {
    if (tweets.length == 0) {
        callback();
        return;
    }

    // build article data
    var articles = [];
    for (var i = 0; i < tweets.length; i++) {
        var tweet = tweets[i];

        var content = tweet.text;
        if (tweet.entities && tweet.entities.media) {
            und.forEach(tweet.entities.media, function(media){
                if (media.media_url) {
                    content += '<br/><img src="' + media.media_url + '" alt="' +
                        media.display_url + '"/>';
                }
            });
        }

        // push the article
        var articleData = {
            article_date: new Date(tweet.created_at),
            fetch_date: moment().format(),
            content: content,
            url: 'http://twitter.com/' + feed.url,
            title: tweet.text,
            article_id: tweet.id_str
        };
        articles.push(articleData);
    }

    // create http request for posting article
    // backend will check if article doesn't already exists
    var opts = url.parse(config.apiLocalUrl + '/feed/' + feed.id + '/article');
    opts.method = 'POST';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    auth.addBasicAuth(opts.headers);
    var req = http.request(opts, function(res){
        // not
        if (res.statusCode != 201 && res.statusCode != 304) {
            console.log("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            callback("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            return;
        }
        var chunks = [];
        res.on("data", function(data){
            chunks.push(data);
        });
        res.on("end", function(){
            // fin ...
            callback(null);
        });
    });
    req.on('error', function(e) {
        console.log('Error while adding articles: ' +  + e.message);
    });

    req.write(JSON.stringify(articles));
    req.write("\n");
    req.end();
}

exports.poll = pollFeedTwitter;

