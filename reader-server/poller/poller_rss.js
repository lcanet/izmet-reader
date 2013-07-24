var
    http = require('http'),
    config = require('../config/config.js'),
    FeedParser  = require('feedparser'),
    request = require('request'),
    url = require('url'),
    utils = require('../utils/utils.js'),
    moment = require('moment');

function pollFeedRSS(feed, callback) {
    console.log("Polling feed " + feed.name + " using rss @ " + feed.url);

    var articles = [];

    request(feed.url)
        .pipe(new FeedParser({feedurl: feed.url}))
        .on('error', function(err) {
            console.log("Error polling feed " + feed.name, err);
        })
        .on('article', function(article){
            articles.push(transformArticleData(article));
        })
        .on('end', function(){
            processArticles(feed, articles, callback);
        })
    ;
}

function transformArticleData(article){
    var articleData = {
        article_date: article.date,
        fetch_date: moment().format(),
        content: article.description,
        url: article.link,
        title: article.title,
        article_id: null
    };
    // specific
    if (!articleData.article_date && article['a10:updated'] != null) {
        articleData.article_date = article['a10:updated']['#'];
    }

    return articleData;
}

function processArticles(feed, articles, callback) {
    if (articles.length == 0) {
        callback();
        return;
    }

    // push the article
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
    req.on('error', function(e) {
        console.log('Error while adding articles: ' +  + e.message);
    });


    req.write(JSON.stringify(articles));
    req.write("\n");
    req.end();
    articles = null;
}

exports.poll = pollFeedRSS;

