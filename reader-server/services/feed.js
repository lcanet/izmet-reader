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
            'SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed where id = $1',
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


var getImage = {
    'spec': {
        "description" : "Get a feed image",
        "path" : "/feed/{id}/image",
        "notes" : "Returns the image (icon) of a feed",
        "summary" : "Get a feed icon",
        "method": "GET",
        "params" : [swagger.pathParam("id", "ID of the feed", "string")],
        "responseClass" : "void",
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "getImage"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        // TODO
        res.send("?");
    }
};
var findAll = {
    'spec': {
        "description" : "Find all feeds",
        "path" : "/feed",
        "notes" : "Returns all feeds",
        "summary" : "Find all feeds",
        "method": "GET",
        "responseClass" : "Array[Feed]",
        "nickname" : "findAllFeeds"
    },
    'action': function (req,res) {
        db.client.query('SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed', function(err, result) {
            res.send(JSON.stringify(result.rows));
        });
    }
};

exports.getImage = getImage;
exports.findById = findById;
exports.findAll = findAll;