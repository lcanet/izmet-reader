var
    config = require('../config/config.js'),
    url = require('url'),
    utils = require('../utils/utils.js'),
    moment = require('moment'),
    http = require('http'),
    parser = require('htmlparser2'),
    auth = require('../utils/auth.js');

function pollFeedDilbert(feed, callback) {

    http.get(feed.url, function(res){
        if (res.statusCode != 200){
            console.log('Error getting dilbert page - error code ' + res.statusCode);
            callback('Error while getting dilbert page - ' + res.statusCode);
            return;
        }

        var chunks = '';
        res.on('data', function(chunk){
            chunks += chunk;
        });
        res.on('end', function(){
            processDilbertPage(feed, chunks, callback);
        });

    });
}

function processDilbertPage(feed, page, callback) {
    var pattern = new RegExp(/The Dilbert Strip/);

    var articles = [];

    var htmlParser = new parser.Parser({
        onopentag: function(name, attribs){
            if (name == 'img') {
                var title = attribs.title;
                if (title && pattern.test(title)) {
                    articles.push(buildArticle(feed, attribs));
                }
            }
        }
    });
    htmlParser.write(page);
    htmlParser.end();

    if (articles.length != 0){
        pushArticles(feed, articles, callback);
    } else {
        console.log('No image found on dilbert page');
        callback('No Image found');
    }

}

function buildArticle(feed, attribs){
    var image = attribs.src;
    var articleId = image;
    var idx = image.lastIndexOf('/');
    if (idx != -1){
        articleId = image.substring(idx+1);
    }

    var content = '<p><b>' + attribs.title + '</b></p><p><img src="' + feed.url + attribs.src + '"/></p>';

    var articleData = {
        article_date: moment().format(),
        fetch_date: moment().format(),
        content: content,
        article_id: articleId,
        url: feed.url,
        title: attribs.title
    };

    return articleData;
}

function pushArticles(feed, articles, callback) {
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
    auth.addBasicAuth(opts.headers);
    var req = http.request(opts, function(res){
        // not
        if (res.statusCode != 201 && res.statusCode != 304) {
            console.log("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            if (callback) callback("Error adding article (" + http.STATUS_CODES[res.statusCode] + ")");
            return;
        }
        var chunks = [];
        res.on("data", function(data){
            chunks.push(data);
        });
        res.on("end", function(){
            if (callback) callback(null);
        });
    });

    req.write(JSON.stringify(articles));
    req.write("\n");
    req.end();
}

exports.poll = pollFeedDilbert;

