var db = require('../db/db.js'),
    swagger = require('swagger-node-express');


var findById = {
    'spec': {
        "description" : "Find a feed",
        "path" : "/feed/{id}",
        "notes" : "Returns a feed based on ID",
        "summary" : "Find feed by ID",
        "method": "GET",
        "params" : [swagger.pathParam("id", "ID of the feed", "string")],
        "responseClass" : "Feed",
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "getFeedById"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);

        db.client.query(
            'SELECT feed.* FROM feed where id = $1',
            [id],
            function(err, result) {
            if (result.rows.length == 0) {
                swagger.errors.notFound('feed', res);
            } else {
                res.send(JSON.stringify(result.rows[0]));
            }
        });
    }
};

var findAll = {
    'spec': {
        "description" : "Find all feeds",
        "path" : "/feeds",
        "notes" : "Returns all feeds",
        "summary" : "Find all feeds",
        "method": "GET",
        "responseClass" : "Feed",
        "nickname" : "findAllFeeds"
    },
    'action': function (req,res) {
        // TODO: utiliser sql
        db.client.query('SELECT * FROM feed', function(err, result) {
            res.send(JSON.stringify(result.rows));
        });
    }
};


exports.findById = findById;
exports.findAll = findAll;