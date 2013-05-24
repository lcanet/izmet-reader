/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , services = require('./services')
    , poller = require('./poller/poller.js')
    , middleware = require('./middleware')
    , config = require('./config/config.js')
    , swagger = require('swagger-node-express');

var app = express();

console.log("Starting in mode " + app.get('env'));

// specific to dev
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// all environments
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(middleware.cacheHandler());

// cors
app.options("*", middleware.allowCrossDomain);

swagger.setAppHandler(app);
swagger.setHeaders = function setHeaders(res) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-API-KEY");
//    res.header("Content-Type", "application/json; charset=utf-8");
};

swagger.addModels(services.models);
// swagger services
swagger.addGet(services.feed.findById);
swagger.addGet(services.feed.findAll);
swagger.addGet(services.feed.getImage);
swagger.addGet(services.feed.getIcon);
swagger.addPut(services.feed.updateFeed);
swagger.addPost(services.feed.addFeed);
swagger.addDelete(services.feed.deleteFeed);
swagger.addGet(services.article.findByFeed);
swagger.addPost(services.article.addArticle);
swagger.addPut(services.article.markArticle);
swagger.addPut(services.article.markArticles);
swagger.addGet(services.article.findArticles);
swagger.addPost(services.poller.forcePoll);
swagger.addPost(services.poller.forcePollAll);
swagger.configureSwaggerPaths("", "/api-docs", "");
swagger.configure(config.apiUrl, "0.1");

app.listen(config.serverPort);
console.log("Server launched on port " + config.serverPort);

poller.startPoller('development' == app.get('env'));
console.log("Poller launched");
