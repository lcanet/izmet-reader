var pg = require('pg'),
    promise = require("promises-a"),
    config = require('../config/config.js');

/**
 * Get a connection from the pool . callback(client) will be called only if a connection suceeded
 * @param callback
 */
var getConnection = function(callback) {
    pg.connect(config.pgUrl, function(err, client, done) {
        try {
            if (err) {
                console.log("Error getting connection from pool", err);
                return;
            }
            callback(client);
        } finally {
            done();
        }
    });
};
var sql = function(query, params, callback){
    getConnection(function(client){
        client.query(query, params, callback);
    });
};


var execSql = function(query, params) {
    var def = promise();
    // console.log("[SQL] '" + query + "' with params", params);
    getConnection(function(client){
        client.query(query, params, function(err,res){
            if (err) {
                console.log("SQL Error", err);
                def.reject(err);
            } else {
                def.fulfill(res);
            }
        });
    });
    return def.promise;
};

exports.getConnection = getConnection;
exports.execSql = execSql;
exports.sql = sql;


