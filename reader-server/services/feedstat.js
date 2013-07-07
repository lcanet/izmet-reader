var db = require('../db/db.js'),
    FeedParser = require('feedparser'),
    request = require('request'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    und = require('underscore'),
    utils = require('../utils/utils.js'),
    Sequelize = require('sequelize'),
    poller = require('../poller/poller.js');


function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}
var getStats = function(req, res){
    res.header("Content-Type", "application/json; charset=utf-8");

    var args = {
        include: [ db.model.Feed ],
        order: 'feed_id asc'
    };

    db.model.FeedStat.findAll(args)
        .success(function (stats) {
            res.send(stats);
        })
        .error(getErrorHandler(res));

};


exports.getStats = getStats;