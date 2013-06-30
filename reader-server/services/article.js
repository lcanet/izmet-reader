var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    und = require('underscore'),
    promise = require("promises-a");


function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}

function getArticles(res, feedId, unreadOnly, starred, limit, offset) {
    res.header("Content-Type", "application/json; charset=utf-8");

    var args = {
        where: { },
        include: [ db.model.Feed ],
        offset: offset,
        limit: limit,
        order: 'article_date desc'
    };
    if (feedId != null){
        args.where.feed_id = feedId;
    }
    if (unreadOnly){
        args.where.read = false;
    }
    if (starred) {
        args.where.starred = true;
    }
    if (und.isEmpty(args.where)) {
        delete args.where;
    }

    db.model.Article.findAll(args)
        .success(function (articles) {
            res.send(articles);
        })
        .error(getErrorHandler(res));
}

var findByFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");

    var feedId = req.params.id;
    if (!feedId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
    } else {
        var limit = parseInt(req.query.limit) || 100;
        var offset = parseInt(req.query.offset) || 0;
        var unreadOnly = "true" == req.query.unreadOnly;
        var starredOnly = "true" == req.query.starred;

        getArticles(res, feedId, unreadOnly, starredOnly, limit, offset);
    }
};

var findArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var limit = parseInt(req.query.limit) || 100;
    var offset = parseInt(req.query.offset) || 0;
    var unreadOnly = "true" == req.query.unreadOnly;
    var starredOnly = "true" == req.query.starred;

    getArticles(res, null, unreadOnly, starredOnly, limit, offset);
};


var addArticle = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var feedId = req.params.id;
    if (!feedId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }

    var article = req.body;

    // first check if article exists
    var q;
    if (article.article_id) {
        q = db.model.Article.find({where: {feed_id: feedId, article_id: article.article_id }});
    } else if (article.article_date) {
        q = db.model.Article.find({where: {feed_id: feedId, article_date: article.article_date}});
    } else {
        q = db.model.Article.find({where: {feed_id: feedId, title: article.title}});
    }

    q.success(function(found){
        if (found) {
            res.send({"code":304, "description":'article already exists'}, 304);
        } else {
            article.feed_id = feedId;
            db.model.Article.create(article)
                .success(function(art){
                    res.send({"code":201, "description":'article created'}, 201);
                })
                .error(getErrorHandler(res));
        }

    }).error(getErrorHandler(res));

};

var markArticle = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var articleId = req.params.articleId;
    if (!articleId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var state = req.body;
    db.model.Article.update(state, {id: articleId})
        .success(function(){
            res.send({code: 200, description: 'ok'}, 200);
        })
        .error(getErrorHandler(res));
};


var markArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var cmd = req.body;
    if (cmd && cmd.all){
        db.model.Article.update({read: true}, {read: false})
            .success(function(){
                res.send({code: 200, description: "Articles updated"});
            })
            .error(getErrorHandler(res));
    } else {
        res.send('?');
    }
};


exports.findByFeed = findByFeed;
exports.addArticle = addArticle;
exports.markArticle = markArticle;
exports.markArticles = markArticles;
exports.findArticles = findArticles;
