/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , services = require('./services')
    , swagger = require('swagger-node-express');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.errorHandler());

swagger.setAppHandler(app);
swagger.addModels(services.models);
swagger.addGet(services.feed.findById);
swagger.addGet(services.feed.findAll);
swagger.addGet(services.article.findByFeed);
swagger.configureSwaggerPaths("", "/api-docs", "");
swagger.configure("http://localhost:8002", "0.1");

swagger.setHeaders = function setHeaders(res) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-API-KEY");
    res.header("Content-Type", "application/json; charset=utf-8");
};

app.listen(8002);
console.log("Server launched");