var pg = require('pg'),
    config = require('../config/config.js');

var client = new pg.Client(config.pgUrl);
client.connect(function(err) {
    console.log("Postgres Client connected");
    if (err){
        console.log("Achtung: error ", err);
    }
});

exports.client = client;

