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
    , nodetime = require('nodetime')
    ;

if (config.nodetime) {
    nodetime.profile({
        accountKey: config.nodetime.key,
        appName: config.nodetime.app
    });
}

var app = express();

console.log("Starting in mode " + config.mode);


// all environments
app.use(express.logger(config.isDev ? 'dev' : 'default'));
app.use(express.compress());
app.use(express.errorHandler());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(middleware.cacheHandler);
app.use("/web-client", express.static(__dirname + '/web-client'));
app.use("/dumps", express.static(__dirname + '/dumps'));

// cors
app.use(middleware.allowCrossDomain);

// auth
if (config.auth){
    app.use(express.basicAuth(function(user,pass){
        if (user in config.auth){
            return pass = config.auth[user];
        } else{
            // not found
            return false;
        }
    }, 'Unautorized'));
}

// service
app.options('*', middleware.cacheCorsHandler);
app.get('/feed', services.feed.findAll);
app.post('/feed', services.feed.addFeed);
app.get('/feed/poll_all', services.poller.forcePollAll);
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
app.get('/article/count', services.article.countArticles);


app.get('/resource/default-icons/:type', services.image.getDefaultIcon);
app.get('/resource/:imageId', services.image.findById);


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

console.log('Stats updater launched');
