var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    poller = require('../poller/poller.js'),
    promise = require("promises-a");

function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}


var forcePollAll = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    poller.pollAllFeeds();
    res.send({"code":200, description:"OK"});
};

var forcePoll = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.model.Feed.find(id)
        .success(function(feed){
            if (feed) {
                poller.pollFeed(feed, function (err) {
                    if (err) {
                        console.log('Error while polling feed', err);
                        res.send({"code":500, description:'Error while polling feeds'});
                    } else {
                        res.send({"code":200, description:"OK"});
                    }
                });

            } else {
                res.send({code: 404, description: 'not found'}, 404);
            }
        })
        .error(getErrorHandler(res));
};


exports.forcePoll = forcePoll;
exports.forcePollAll = forcePollAll;
