var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    und = require('underscore'),
    Sequelize = require('sequelize'),
    promise = require("promises-a");


function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}

function getArticles(res, feedId, unseenOnly, starred, limit, offset) {
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
    if (unseenOnly){
        args.where.seen = false;
    }
    if (starred) {
        args.where.starred = true;
    }
    if (und.isEmpty(args.where)) {
        delete args.where;
    }

    db.model.Article.findAll(args)
        .success(function (articles) {
            for (var i = 0; i < articles.length; i++) {
                articles[i].feed = articles[i].feed.output();
            }
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
        var unseenOnly = "true" == req.query.unseenOnly;
        var starredOnly = "true" == req.query.starred;

        getArticles(res, feedId, unseenOnly, starredOnly, limit, offset);
    }
};

var findArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var limit = parseInt(req.query.limit) || 100;
    var offset = parseInt(req.query.offset) || 0;
    var unseenOnly = "true" == req.query.unseenOnly;
    var starredOnly = "true" == req.query.starred;

    getArticles(res, null, unseenOnly, starredOnly, limit, offset);
};

var addArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var feedId = req.params.id;
    if (!feedId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }

    var articles = req.body;
    if (!und.isArray(articles)) {
        articles = [articles];
    }

    var chainer = new Sequelize.Utils.QueryChainer();
    for (var i = 0; i < articles.length; i++) {
        var article = articles[i];
        var q;
        if (article.article_id) {
            q = db.model.Article.find({where: {feed_id: feedId, article_id: article.article_id }});
        } else if (article.article_date) {
            q = db.model.Article.find({where: {feed_id: feedId, article_date: article.article_date}});
        } else {
            q = db.model.Article.find({where: {feed_id: feedId, title: article.title}});
        }
        chainer.add(q);
    }

    chainer.runSerially()
        .success(function(result){
            var chainer = new Sequelize.Utils.QueryChainer();
            var nbArticlesToAdd = 0;
            for (var i = 0; i < articles.length; i++) {
                var article = articles[i];
                var existing = result[i] != null;
                if (!existing) {
                    nbArticlesToAdd++;
                    article.feed_id = feedId;
                    chainer.add(db.model.Article.create(article));
                }
            }

            if (nbArticlesToAdd > 0) {
                chainer.runSerially()
                    .success(function(createdArticles){
                        res.send(201, createdArticles);
                    })
                    .error(getErrorHandler(res));

            } else {
                res.send(304, {code: 304, description: 'No Articles to add'});
            }
        })
        .error(getErrorHandler(res));

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
    if (und.isArray(cmd)){
        // updates
        var chainer = new Sequelize.Utils.QueryChainer();
        for (var i = 0; i < cmd.length; i++) {
            var updates = und.clone(cmd[i]);
            delete updates.id;
            chainer.add(db.model.Article.update(updates, {id: cmd[i].id }));

        }
        chainer.runSerially()
            .success(function(result){
                res.send({code: 200, description: "Articles updated"});
            })
            .error(getErrorHandler(res));

    } else if (cmd && cmd.all){
        db.model.Article.update({seen: true}, {seen: false})
            .success(function(){
                res.send({code: 200, description: "Articles updated"});
            })
            .error(getErrorHandler(res));
    } else {
        res.send('?');
    }
};


exports.findByFeed = findByFeed;
exports.addArticles = addArticles;
exports.markArticle = markArticle;
exports.markArticles = markArticles;
exports.findArticles = findArticles;
