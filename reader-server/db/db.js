var pg = require('pg');

// TODO: parametrer
var conString = "postgres://reader:reader@192.168.0.2/reader";
var client = new pg.Client(conString);
client.connect(function(err) {
    console.log("Client connected", err);
});

exports.client = client;

