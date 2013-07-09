/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , services = require('./services')
    , poller = require('./poller/poller.js')
    , statsUpdater = require('./poller/stats_updater.js')
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
app.use("/dumps", express.static(__dirname + '/dumps'));

// cors
app.use(middleware.allowCrossDomain);
app.options("*",
    function(res,res){
        res.header('Access-Control-Max-Age', '86400');
        res.send('');
    });

// swagger services

app.get('/feed', services.feed.findAll);
app.post('/feed', services.feed.addFeed);
app.get('/feed/:id', services.feed.findById);
app.put('/feed/:id', services.feed.updateFeed);
app.delete('/feed/:id', services.feed.deleteFeed);
app.post('/feed/:id/poll', services.poller.forcePoll);
app.get('/feed/:id/article', services.article.findByFeed);
app.put('/feed/:id/article', services.feed.markAllAsSeen);
app.post('/feed/:id/article', services.article.addArticles);
app.get('/feed/:id/image', services.feed.getImage);
app.get('/feed/:id/icon', services.feed.getIcon);
app.post('/feed/poll_all', services.poller.forcePollAll);

app.get('/favorites', services.feed.getFavorites);

app.get('/article', services.article.findArticles);
app.put('/article', services.article.markArticles);
app.put('/article/:articleId', services.article.markArticle);


app.get('/resource/default-icons/:type', services.image.getDefaultIcon);
app.get('/resource/:imageId', services.image.findById);

app.get('/feed-stats', services.feedStat.getStats);
app.get('/refresh-feed-stats', function(res, res){
    statsUpdater.updateStats();
    res.send('Stats refreshed');
});

// redirect root at end
app.use('/', function(req, res){
    res.redirect('/web-client/index.html');
});

app.listen(config.serverPort);
console.log("Server launched on port " + config.serverPort);

process.on('uncaughtException', function(e){
    console.trace("UNCAUGHT", e);

});

poller.startPoller('development' == app.get('env'));
console.log("Poller launched");

statsUpdater.startUpdater('development' == app.get('env'));
console.log('Stats updater launched');
