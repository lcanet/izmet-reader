var models = require('./models.js');
var feed = require('./feed.js');
var article = require('./article.js');
var cors = require('./cors.js');

exports.feed = feed;
exports.article = article;
exports.models = models;
exports.allowCrossDomain = cors.allowCrossDomain;
