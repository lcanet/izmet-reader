var allowCrossDomain = require('./cors.js');
var cache = require('./cache.js');

exports.cacheHandler = cache.cacheHandler;
exports.cacheCorsHandler = cache.cacheCorsHandler;
exports.allowCrossDomain = allowCrossDomain.allowCrossDomain;
