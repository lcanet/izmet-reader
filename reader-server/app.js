/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , services = require('./services')
    , poller = require('./poller/poller.js')
    , config = require('./config/config.js')
    , swagger = require('swagger-node-express');

var app = express();


// all environments
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.errorHandler());

// cors
app.options("*", services.allowCrossDomain);

swagger.setAppHandler(app);
swagger.addModels(services.models);
// swagger services
swagger.addGet(services.feed.findById);
swagger.addGet(services.feed.findAll);
swagger.addGet(services.feed.getImage);
swagger.addPut(services.feed.updateFeed);
swagger.addGet(services.article.findByFeed);
swagger.addPost(services.article.addArticle);
swagger.addPut(services.article.markArticle);
swagger.addPut(services.article.markArticles);
swagger.addGet(services.article.findArticles);
swagger.configureSwaggerPaths("", "/api-docs", "");
swagger.configure(config.apiUrl, "0.1");

app.listen(config.serverPort);
console.log("Server launched on port " + config.serverPort);

poller.startPoller();
console.log("Poller launched");
