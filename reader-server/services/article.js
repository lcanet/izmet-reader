var db = require('../db/db.js'),
    swagger = require('swagger-node-express'),
    utils = require('../utils/utils.js'),
    und = require('underscore'),
    promise = require("promises-a");


var findByFeed = {
    'spec': {
        "description" : "Find all articles of a feed",
        "path" : "/feed/{id}/article",
        "notes" : "Returns all articles of a feed",
        "summary" : "Find all articles of a feed",
        "params" : [
            swagger.pathParam("id", "ID of the feed", "string"),
            swagger.queryParam("read", "Show only unread articles", "boolean", "false", "false", ["true", "false"], false),
            swagger.queryParam("limit", "Limit articles", "int"),
            swagger.queryParam("offset", "offset of Limit articles", "int")
        ],
        "method": "GET",
        "responseClass" : "Array[Article]",
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "findAllArticples"
    },
    'action': function (req,res) {
        res.header("Content-Type", "application/json; charset=utf-8");

        var feedId = req.params.id;
        if (!feedId) {
            throw swagger.errors.invalid('id');
        }
        db.execSql('SELECT * FROM feed where id = $1', [feedId]).then(function(result) {
            if (result.rows.length == 0){
                swagger.errors.notFound('feed', res);
                throw 0;
            } else {
                var limit = parseInt(req.query.limit) || 100;
                var offset = parseInt(req.query.offset) || 0;

                var q = 'SELECT id,fetch_date,article_date,title,content,url,read FROM article where feed_id = $1';
                var p = [feedId, limit, offset];
                if (req.query.read) {
                    q += " and read = false";
                }
                q += " order by id desc";
                q += " limit $2 offset $3";
                return db.execSql(q, p);
            }
        }).then(function(result){
            res.send(JSON.stringify(result.rows));
        });
    }
};


var findArticles = {
    'spec': {
        "description" : "Find all articles",
        "path" : "/article",
        "notes" : "Returns all articles (read or unread) Use this operation to get all unread articles",
        "summary" : "Finds all articles. ",
        "params" : [
            swagger.queryParam("read", "Show only unread articles", "boolean", "false", "false", ["true", "false"], true),
            swagger.queryParam("limit", "Limit articles", "int"),
            swagger.queryParam("offset", "offset of Limit articles", "int")
        ],
        "method": "GET",
        "responseClass" : "Array[ArticleWithFeed]",
        "nickname" : "findArticles"
    },
    'action': function (req,res) {
        res.header("Content-Type", "application/json; charset=utf-8");
        var limit = parseInt(req.query.limit) || 100;
        var offset = parseInt(req.query.offset) || 0;

        var q = 'SELECT a.id,a.fetch_date,a.article_date,a.title,a.content,a.url,a.read,' +
            'f.id as feedid, f.name,f.description,f.url,f.type ' +
            'FROM article a ' +
            'INNER JOIN feed f on f.id = a.feed_id ' +
            'where 1=1';
        var p = [limit, offset];
        if (req.query.read) {
            q += " and read = false";
        }
        q += " order by id desc";
        q += " limit $1 offset $2";
        db.execSql(q, p).then(function(result){
            und.each(result.rows, function(elt){
                // replace "feed" object
                utils.objectify(elt, "feed", "name","description", "url", "type", "feedid");
                // some manual changes
                elt.feed.id = elt.feed.feedid;
                delete elt.feed.feedid;
            });
            res.send(JSON.stringify(result.rows));
        });
    }
};


var addArticle = {
    'spec': {
        "description" : "Add an  article",
        "path" : "/feed/{id}/article",
        "notes" : "Post a new article (you must be a feed aggregator)",
        "summary" : "Post a new article",
        "params" : [
            swagger.pathParam("id", "ID of the feed", "string"),
            {
                paramType: "body",
                required: "true",
                dataType: "Article",
                description: "Article to add"
            }
        ],
        "method": "POST",
        "responseClass" : "void",
        "errorResponses" : [
            swagger.errors.invalid('id'),
            swagger.errors.notFound('feed'),
            {code: 201, description: 'Article created'},
            {code: 304, description: 'Article already exists'}
        ],
        "nickname" : "addArticle"
    },
    'action': function (req,res) {
        res.header("Content-Type", "application/json; charset=utf-8");
        var feedId = req.params.id;
        if (!feedId) {
            throw swagger.errors.invalid('feedId');
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
            .then(function(result){
                var nb = result.rows[0].nb;

                if (nb == 0){
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
                    res.send({"code": 304, "description": 'article already exists'}, 304);
                    throw 0;
                }
            })
            .then(function(result){
                if (result != 0) {
                    res.send({"code": 201, "description": 'article created'}, 201);
                }
            });
    }
};

function buildQueryPlaceholder(nb) {
    var s = "(";
    for (var i = 0; i < nb; i++) {
        if (i != 0){
            s += ", ";
        }
        s+= ("$" + (i+1));
    }
    s += ")";
    return s;
}

function updateArticles(articlesState) {
    var idsRead = [];
    var idsUnread = [];
    for (var i = 0; i < articlesState.length; i++){
        if (articlesState[i].read){
            idsRead.push(articlesState[i].id);
        } else {
            idsUnread.push(articlesState[i].id);
        }
    }

    var def = promise();
    var p = def.promise;
    if (idsRead.length > 0){
        p = p.then(function(){
            return db.execSql("update article set read = true where id in " + buildQueryPlaceholder(idsRead.length),
                idsRead);
        });
    }
    if (idsUnread.length > 0){
        p = p.then(function(){
            return db.execSql("update article set read = false where id in " + buildQueryPlaceholder(idsUnread.length),
                idsUnread);
        });
    }
    def.fulfill("0");
    return p;
}



var markArticle = {
    'spec': {
        "description" : "",
        "path" : "/article/{articleId}",
        "notes" : "Change article state (read or unread)",
        "summary" : "Change article state",
        "params" : [
            swagger.pathParam("articleId", "ID of an article", "string"),
            {
                paramType: "body",
                required: "true",
                dataType: "ArticleState",
                description: "Article state"
            }
        ],
        "method": "PUT",
        "responseClass" : "void",
        "errorResponses" : [swagger.errors.invalid('articleId'), swagger.errors.notFound('article')],
        "nickname" : "markArticle"
    },
    'action': function (req,res) {
        res.header("Content-Type", "application/json; charset=utf-8");
        var articleId = req.params.articleId;
        if (!articleId) {
            throw swagger.errors.invalid('articleId');
        }
        var state = req.body;
        updateArticles([{
            id: articleId,
            read: state.read
        }]).then(function(){
            res.send("");
        });
    }
};


var markArticles = {
    'spec': {
        "description" : "",
        "path" : "/article",
        "notes" : "Change articles state (read or unread)",
        "summary" :"Mass change articles state",
        "params" : [
            {
                paramType: "body",
                required: "true",
                dataType: "Array[ArticleState]",
                description: "Articles state"
            }
        ],
        "method": "PUT",
        "responseClass" : "void",
        "nickname" : "markArticles"
    },
    'action': function (req,res) {
        res.header("Content-Type", "application/json; charset=utf-8");
        var state = req.body;
        updateArticles(req.body).then(function(result){
           res.send("");
        });
    }
};


exports.findByFeed = findByFeed;
exports.addArticle = addArticle;
exports.markArticle = markArticle;
exports.markArticles = markArticles;
exports.findArticles = findArticles;