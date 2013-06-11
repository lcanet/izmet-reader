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
;

var app = express();

console.log("Starting in mode " + config.mode);

app.use(express.errorHandler());

// all environments
app.use(express.logger(config.isDev ? 'dev' : 'default'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(middleware.cacheHandler());
app.use("/web-client", express.static(__dirname + '/web-client'));
app.use('/', function(req, res){
    res.redirect('/web-client/index.html');
});

// cors
app.options("*", middleware.allowCrossDomain);

// swagger services

app.get('/feed', services.feed.findAll);
app.post('/feed', services.feed.addFeed);
app.get('/feed/:id', services.feed.findById);
app.put('/feed/:id', services.feed.updateFeed);
app.put('/feed/:id/mark', services.feed.markAllAsRead);
app.delete('/feed/:id', services.feed.deleteFeed);
app.get('/feed/:id/image', services.feed.getImage);
app.get('/feed/:id/icon', services.feed.getIcon);
app.post('/feed/:id/poll', services.poller.forcePoll);
app.get('/feed/:id/article', services.article.findByFeed);
app.post('/feed/:id/article', services.article.addArticle);
app.get('/feed/default-icons/:type', services.feed.getDefaultIcon);

app.post('/feed/poll_all', services.poller.forcePollAll);

app.get('/article', services.article.findArticles);
app.put('/article', services.article.markArticles);
app.put('/article/:articleId', services.article.markArticle);

app.listen(config.serverPort);
console.log("Server launched on port " + config.serverPort);

process.on('uncaughtException', function(e){
    console.trace("UNCAUGHT", e);

});

poller.startPoller('development' == app.get('env'));
console.log("Poller launched");
