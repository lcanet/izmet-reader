var
    http = require('http'),
    config = require('../config/config.js'),
    FeedParser  = require('feedparser'),
    request = require('request'),
    url = require('url'),
    moment = require('moment');

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


function processFeedArticle(feed, article, callback) {
    // push the article
    var articleData = {
        article_date: article.date != null ? article.date.getTime() : new Date().getTime(),
        fetch_date: new Date().getTime(),
        content: article.description,
        url: article.link,
        title: article.title,
        article_id: null
    };

    // create http request for posting article
    // backend will check if article doesn't already exists
    var opts = url.parse(config.apiLocalUrl + '/feed/' + feed.id + '/article');
    opts.method = 'POST';
    opts.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    var req = http.request(opts, function(res){
        // not
        if (res.statusCode != 201 && res.statusCode != 304) {
            console.log("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            if (callback) callback();
            return;
        }
        var chunks = [];
        res.on("data", function(data){
            chunks.push(data);
        });
        res.on("end", function(){
            if (callback) callback();
        });
    });

    req.write(JSON.stringify(articleData));
    req.write("\n");
    req.end();
}

exports.poll = pollFeedRSS;

