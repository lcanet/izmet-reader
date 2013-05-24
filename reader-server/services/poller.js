var swagger = require('swagger-node-express'),
    db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    poller = require('../poller/poller.js'),
    promise = require("promises-a");


var forcePollAll = {
    'spec': {
        "description" : "Force polling of all feeds",
        "path" : "/feed/poll_all",
        "notes" : "Force polling of all feeds, Asynchronous",
        "summary" : "Force polling of all feeds",
        "params" : [
        ],
        "method": "POST",
        "responseClass" : "String",
        "nickname" : "forcePollAll"
    },
    'action': function (req,res) {
        poller.pollAllFeeds();
        res.send({"code": 200, description: "OK"});
    }
};

var forcePoll = {
    'spec': {
        "description" : "Force polling of a feed",
        "path" : "/feed/{id}/poll",
        "notes" : "Force polling of a feed. Synchronous",
        "summary" : "Force polling of a feed",
        "method": "POST",
        "params" : [
            swagger.pathParam("id", "ID of the feed", "string")
        ],
        "responseClass" : "String",
        "errorResponses" : [
            swagger.errors.invalid('id'),
            swagger.errors.notFound('feed')
        ],
        "nickname" : "updateFeed"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        var feedData = req.body;

        db.execSql("select * from feed where id = $1", [id])
            .then(function(result){
                if (result.rows == null || result.rows.length === 0) {
                    swagger.errors.notFound('feed', res);
                } else {
                    poller.pollFeed(result.rows[0], function(){
                        res.send({"code": 200, description: "OK"});
                    });
                }
            }, function(err){
                res.send({"code": 500, "description": 'feed cannot be updated'}, 500);
            });
    }
};


exports.forcePoll = forcePoll;
exports.forcePollAll = forcePollAll;
