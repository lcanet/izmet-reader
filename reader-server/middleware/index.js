var allowCrossDomain = require('./cors.js');
var cache = require('./cache.js');

exports.cacheHandler = function() { return cache.cache };
exports.allowCrossDomain = allowCrossDomain.allowCrossDomain;