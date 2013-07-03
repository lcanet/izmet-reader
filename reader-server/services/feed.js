var db = require('../db/db.js'),
    FeedParser = require('feedparser'),
    request = require('request'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    und = require('underscore'),
    utils = require('../utils/utils.js'),
    Sequelize = require('sequelize'),
    poller = require('../poller/poller.js');


function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}

/**
 * Process a feed before returning
 */
function processFeed(feed) {
    return feed.output();
}

function processFeeds(feeds) {
    var res = und.map(feeds, processFeed);
    // sort case insensitively
    res.sort(function(a,b){
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    return res;
}

function getFeed(id, res) {
    db.model.Feed.find(id)
        .success(function(feed){
            if (feed == null){
                res.send({code: 404, description: 'Not found'}, 404);
            } else {
                res.send(processFeed(feed));
            }
        })
        .error(getErrorHandler(res));
}

var findById = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    getFeed(id, res);
};


var findAll = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    db.model.Feed.findAll({order: 'name'})
        .success(function(feeds){
            res.send(processFeeds(feeds));
        })
        .error(getErrorHandler(res));
};

var updateFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    var feedData = req.body;

    db.model.Feed.find(id)
        .success(function(feed){
            if (feed == null) {
                res.send({code: 404, description: 'Not found'}, 404);
            } else {
                feed.updateAttributes(feedData, ['last_poll'])
                    .success(function(){
                        // ok ..
                        res.send({code:200, description:'Feed updated'}, 200);
                    })
                    .error(getErrorHandler(res));
            }
        })
        .error(getErrorHandler(res));
};


var addFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var feedData = req.body;

    if (feedData.type == 'rss') {
        addFeedRss(feedData, res);
    } else if (feedData.type == 'twitter') {
        addFeedTwitter(feedData, res);
    } else {
        res.send({code:402, description:'Unknown feed type'}, 402);
    }
};

function addFeedRss(feedData, res) {
    // get feed data
    var feedOk = true;
    var feedImageUrl = null;

    request(feedData.url)
        .pipe(new FeedParser({feedurl:feedData.url}))
        .on('error', function (err) {
            console.log("Error getting feed " + feedData.url, err);
            feedOk = false;
            res.send({code:500, description:'Error getting feed'}, 500);
        })
        .on('meta', function (meta) {
            if (meta.image && meta.image.url) {
                feedImageUrl = meta.image.url;
            }
            // use provided feed description
            if (!feedData.name && meta.title) {
                feedData.name = meta.title;
            }
            if (!feedData.description && meta.description) {
                feedData.description = meta.description;
            }
        })
        .on('end', function (err) {
            if (feedOk) {
                addFeedRssSave(feedData, feedImageUrl, res);
            } else {
                res.send(500, {description: 'Bad feed', code: 500});
            }
        });
}

function addFeedRssSave(feedData, feedImageUrl, res) {
    db.model.Feed.create(feedData)
        .success(function(feed){
            // add feed image
            if (feedImageUrl != null) {
                console.log("Downloading image for feed " + feed.name + " on " + feedImageUrl);
                addImageForFeed(feed, feedImageUrl);
            }

            // also add favicon if there is any
            addIconForFeed(feed);

            // initial poll
            poller.pollFeed(feed, function () {
                res.location('/feed/' + feed.id);
                res.send(201, { id : feed.id });
            });

        })
        .error(getErrorHandler(res));

}

function addFeedTwitter(feedData, res) {
    if (!feedData.name) {
        feedData.name = feedData.url;
    }
    feedData.description = 'Twitter of ' + feedData.name;
    db.model.Feed.create(feedData)
        .success(function(feed){
            poller.pollFeed(feed, function () {
                res.location('/feed/' + feed.id);
                res.send(201, { id : feed.id });
            });
        })
        .error(getErrorHandler(res));
}

function isImage(response) {
    var content = response.headers['content-type'];
    return content &&(
        content.toLowerCase().indexOf('image/') == 0 ||
        content.toLowerCase().indexOf('text/plain') == 0);
}

function addIconForFeed(feed) {
    var opts = url.parse(feed.url);
    // erase path
    opts.path = opts.pathname = '/favicon.ico';

    request({url:url.format(opts), encoding:null}, function (err, response, body) {
        if (!err && response.statusCode == 200 && isImage(response)) {
            var image = db.model.Image.build({
                content_type: response.headers['content-type'],
                data: body.toString('base64'),
                creation_date: new Date()
            });
            image.save()
                .success(function(image){
                    // only save id
                    feed.icon_id = image.id;
                    feed.save(['icon_id']);
                })
                .error(getErrorHandler());
        }
    });
}

function addImageForFeed(feed, imageurl) {

    // poll rest pi
    request({url:imageurl, encoding:null}, function (err, response, body) {
        if (!err && response.statusCode == 200 && isImage(response)) {
            var image = db.model.Image.build({
                content_type: response.headers['content-type'],
                data: body.toString('base64'),
                creation_date: new Date()
            });
            image.save()
                .success(function(image){
                    // only save id
                    feed.image_id = image.id;
                    feed.save(['image_id']);
                })
                .error(getErrorHandler());
        }
    });
}


var deleteFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);


    db.model.Feed.find(id)
        .success(function(feed){
            if (feed){
                // delete articles
                var chainer = new Sequelize.Utils.QueryChainer();
                chainer.add(db.model.Article.destroy({feed_id: id}));
                chainer.add(feed.destroy());
                chainer.runSerially({ skipOnError: true })
                    .success(function(){
                        res.send({code: 200, description: 'Feed deleted'});
                    })
                    .error(getErrorHandler(res));
            } else{
                res.send(404, {code: 404, description: 'Cannot delete non-existant feed'});
            }
        })
        .error(getErrorHandler(res));
};



var markAllAsSeen = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.model.Article.update({seen: true}, {feed_id: id})
        .success(function(){
            res.send({code:200, description:'Articles read'}, 200);
        })
        .error(getErrorHandler(res));
};

function getFavoritesFetchArticles(feeds, res) {
    var inError = false;
    var resultingFeeds = [];

    // fetch articles
    var chainer = new Sequelize.Utils.QueryChainer();
    for (var i = 0; i < feeds.length; i++){
        chainer.add(db.model.Article.findAll({
            where: {
                feed_id: feeds[i].id,
                seen: false
            },
            order: 'article_date desc',
            limit: 3
        }));
    }
    chainer.runSerially({ skipOnError: true })
        .success(function(results){
            for (var i = 0; i < results.length; i++){
                feeds[i].articles = results[i];
            }
            res.send(feeds);
        })
        .error(getErrorHandler(res));

}

function getPopularity(feedStruct) {
    // avoid divide by zero
    if (feedStruct.nbarticles == 0){
        return 0;
    }
    var starRatio = feedStruct.nbstarred / feedStruct.nbarticles;
    var readRatio = feedStruct.nbread / feedStruct.nbarticles;
    var pop = (starRatio + readRatio) / 2;
    return pop;
}

var getFavorites = function(req, res){
    // fetch 6 best feed by star-rating

    res.header("Content-Type", "application/json; charset=utf-8");

    var chainer = new Sequelize.Utils.QueryChainer();
    chainer.add(db.sql.query('select feed_id, ' +
        'sum(case when starred then 1 else 0 end) as nbStarred, ' +
        'sum(case when read then 1 else 0 end) as nbRead, ' +
        'count(1) as nbArticles ' +
        'from article ' +
        'group by feed_id ' +
        'order by 2 desc'));
    chainer.add(db.model.Feed.findAll());
    chainer.runSerially({ skipOnError: true })
        .success(function(results){
            var counts = results[0];
            // sort according to 'popularity', mix of star and read
            counts = und.sortBy(counts, getPopularity);
            counts.reverse();

            // build a table indexed by id
            var feedsTable = und.groupBy(results[1], function(feed){return feed.id; });

            // get best feeds
            var feeds = [];
            for (var i = 0; i < counts.length && feeds.length < 8; i++) {
                var feedId = counts[i].feed_id;
                var feedsOfThisId = feedsTable[feedId];
                if (feedsOfThisId && feedsOfThisId.length > 0) {
                    var feed = feedsOfThisId[0];
                    if (feed && feed.nb_unseen > 0){
                        // also add popularity
                        var feedDataPlain = processFeed(feed);
                        feedDataPlain.popularity = getPopularity(counts[i]);
                        feeds.push(feedDataPlain);
                    }
                }
            }

            getFavoritesFetchArticles(feeds, res);
        })
        .error(getErrorHandler(res));
};


function getSubResource(req, res, type){
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.model.Feed.find(id)
        .success(function(feed){
            if (feed){
                var subResourceId = feed[type];
                if (subResourceId){
                    res.redirect('/resource/' + subResourceId);
                } else {
                    res.send(404, {code: 404, description: 'Sub resource not found'});
                }
            } else {
                res.send(404, {code: 404, description: 'Feed not found'});
            }
        })
        .error(getErrorHandler(res));

    getFeed(id, res);

}

var getImage = function(req, res){
    getSubResource(req, res, "image_id");
};

var getIcon = function(req, res){
    getSubResource(req, res, "icon_id");
};


exports.findById = findById;
exports.findAll = findAll;
exports.updateFeed = updateFeed;
exports.addFeed = addFeed;
exports.deleteFeed = deleteFeed;
exports.markAllAsSeen = markAllAsSeen;
exports.getFavorites = getFavorites;
exports.getImage = getImage;
exports.getIcon = getIcon;