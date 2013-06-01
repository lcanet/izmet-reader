var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    poller = require('../poller/poller.js'),
    promise = require("promises-a");


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
    db.execSql("select * from feed where id = $1", [id])
        .then(function (result) {
            if (result.rows == null || result.rows.length === 0) {
                res.send({code: 404, description: 'not found'}, 404);
            } else {
                poller.pollFeed(result.rows[0], function () {
                    res.send({"code":200, description:"OK"});
                });
            }
        }, function (err) {
            res.send({"code":500, "description":'feed cannot be updated'}, 500);
        });
};


exports.forcePoll = forcePoll;
exports.forcePollAll = forcePollAll;
