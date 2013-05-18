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
        "description" : "Find all feeds",
        "path" : "/feed/{feedId}/articles",
        "notes" : "Returns all articles of a feed",
        "summary" : "Find all articles of a feed",
        "params" : [
            swagger.pathParam("feedId", "ID of the feed", "string"),
            swagger.queryParam("read", "Show only unread articles", "boolean", "false", "false", ["true", "false"], false),
            swagger.queryParam("limit", "Limit articles", "int"),
            swagger.queryParam("offset", "offset of Limit articles", "int")
        ],
        "method": "GET",
        "responseClass" : "Article",
        "errorResponses" : [swagger.errors.invalid('feedId'), swagger.errors.notFound('feed')],
        "nickname" : "findAllArticles"
    },
    'action': function (req,res) {
        var feedId = req.params.feedId;
        if (!feedId) {
            throw swagger.errors.invalid('feedId');
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


exports.findByFeed = findByFeed;