var pg = require('pg'),
    promise = require("promises-a"),
    config = require('../config/config.js');

var client = new pg.Client(config.pgUrl);
client.connect(function(err) {
    console.log("Postgres Client connected");
    if (err){
        console.log("Achtung: error ", err);
    }
});

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

var execSql = function(query, params) {
    var def = promise();
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

exports.client = client;
exports.getConnection = getConnection;
exports.execSql = execSql;

