var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    und = require('underscore'),
    promise = require("promises-a");

function getArticles(res, feedId, read, limit, offset) {
    res.header("Content-Type", "application/json; charset=utf-8");

    var p = [limit, offset];

    var q = 'SELECT a.id,a.fetch_date,a.article_date,a.title,a.content,a.url,a.read,' +
        'f.id as feedid, f.name,f.description,f.url,f.type ' +
        'FROM article a ' +
        'INNER JOIN feed f on f.id = a.feed_id ' +
        'where 1=1 ';
    if (feedId != null) {
        q += ' and a.feed_id = $3';
        p.push(feedId);
    }
    if (!read) {
        q += " and read = false";
    }
    q += " order by article_date desc";
    q += " limit $1 offset $2";
    db.execSql(q, p).then(function (result) {
        und.each(result.rows, function (elt) {
            // replace "feed" object
            utils.objectify(elt, "feed", "name", "description", "url", "type", "feedid");
            // some manual changes
            elt.feed.id = elt.feed.feedid;
            delete elt.feed.feedid;
        });
        res.send(JSON.stringify(result.rows));
    });

}

var findByFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");

    var feedId = req.params.id;
    if (!feedId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
    } else {
        var limit = parseInt(req.query.limit) || 100;
        var offset = parseInt(req.query.offset) || 0;
        getArticles(res, feedId, req.query.read, limit, offset);
    }
};

var findArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var limit = parseInt(req.query.limit) || 100;
    var offset = parseInt(req.query.offset) || 0;

    getArticles(res, null, req.query.read, limit, offset);
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
    var queryExists;
    var queryParams;
    if (article.article_id) {
        queryExists = "select count(1) as nb from article where feed_id = $1 and article_id = $2";
        queryParams = [feedId, article.article_id];
    } else {
        queryExists = "select count(1) as nb from article where feed_id = $1 and article_date = $2 and title = $3";
        queryParams = [feedId, new Date(article.article_date), article.title];
    }

    db.execSql(queryExists, queryParams)
        .then(function (result) {
            var nb = result.rows[0].nb;

            if (nb == 0) {
                // add article
                return db.execSql("insert into article (feed_id, fetch_date, article_date, title, content, url, article_id, read)" +
                    "values ($1, $2, $3, $4, $5, $6, $7, $8)",
                    [feedId,
                        new Date(article.fetch_date),
                        new Date(article.article_date),
                        article.title,
                        article.content,
                        article.url,
                        article.article_id,
                        false]);
            } else {
                res.send({"code":304, "description":'article already exists'}, 304);
                throw 0;
            }
        })
        .then(function (result) {
            if (result != 0) {
                res.send({"code":201, "description":'article created'}, 201);
            }
        });
};

function buildQueryPlaceholder(nb) {
    var s = "(";
    for (var i = 0; i < nb; i++) {
        if (i != 0) {
            s += ", ";
        }
        s += ("$" + (i + 1));
    }
    s += ")";
    return s;
}

function updateArticles(articlesState) {
    var idsRead = [];
    var idsUnread = [];
    for (var i = 0; i < articlesState.length; i++) {
        if (articlesState[i].read) {
            idsRead.push(articlesState[i].id);
        } else {
            idsUnread.push(articlesState[i].id);
        }
    }

    var def = promise();
    var p = def.promise;
    if (idsRead.length > 0) {
        p = p.then(function () {
            return db.execSql("update article set read = true where id in " + buildQueryPlaceholder(idsRead.length),
                idsRead);
        });
    }
    if (idsUnread.length > 0) {
        p = p.then(function () {
            return db.execSql("update article set read = false where id in " + buildQueryPlaceholder(idsUnread.length),
                idsUnread);
        });
    }
    def.fulfill("0");
    return p;
}


var markArticle = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var articleId = req.params.articleId;
    if (!articleId) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var state = req.body;
    updateArticles([
        {
            id:articleId,
            read:state.read
        }
    ]).then(function () {
            res.send("");
        });
};


var markArticles = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var state = req.body;
    updateArticles(req.body).then(function (result) {
        res.send("");
    });
};


exports.findByFeed = findByFeed;
exports.addArticle = addArticle;
exports.markArticle = markArticle;
exports.markArticles = markArticles;
exports.findArticles = findArticles;