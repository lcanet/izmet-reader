var db = require('../db/db.js'),
    swagger = require('swagger-node-express'),
    promise = require("promises-a");


function execSql(query, params) {
    var def = promise();
    db.client.query(query, params, function(err,res){
        if (err) {
            def.reject(err);
        } else {
            def.fulfill(res);
        }
    });
    return def.promise;
}

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
        "nickname" : "findAllArticles"
    },
    'action': function (req,res) {
        var feedId = req.params.id;
        if (!feedId) {
            throw swagger.errors.invalid('id');
        }
        execSql('SELECT * FROM feed where id = $1', [feedId]).then(function(result) {
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
                return execSql(q, p);
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
        "responseClass" : "Array[Article]",
        "nickname" : "findArticles"
    },
    'action': function (req,res) {
        var limit = parseInt(req.query.limit) || 100;
        var offset = parseInt(req.query.offset) || 0;

        var q = 'SELECT id,fetch_date,article_date,title,content,url,read FROM article where 1=1';
        var p = [limit, offset];
        if (req.query.read) {
            q += " and read = false";
        }
        q += " order by id desc";
        q += " limit $1 offset $2";
        execSql(q, p).then(function(result){
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
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "addArticle"
    },
    'action': function (req,res) {
        var feedId = req.params.id;
        if (!feedId) {
            throw swagger.errors.invalid('feedId');
        }
        console.log(req.body);
        res.send("?");
        // TODO
    }
};

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
        var articleId = req.params.articleId;
        if (!articleId) {
            throw swagger.errors.invalid('articleId');
        }
        res.send("?");
        // TODO
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
        res.send("?");
        // TODO
    }
};


exports.findByFeed = findByFeed;
exports.addArticle = addArticle;
exports.markArticle = markArticle;
exports.markArticles = markArticles;
exports.findArticles = findArticles;