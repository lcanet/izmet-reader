/* global moment */
/* global _ */

function agoCalc(arg) {
    'use strict';
    if (!arg) {
        return 'Unknown';
    }
    // don't print 'ago' if more than 10 day
    var m = moment(arg);
    if (m.isBefore(moment().subtract('d', 10))) {
        return m.format('D MMM YYYY');
    } else {
        return m.fromNow();
    }
}

angular.module('izmet')
    .filter('ago', function () {
        'use strict';
        return function (arg, prop) {
            if (arg === null) {
                return null;
            }
            // lazy evaluation
            if (!arg.__cache_ago) {
                arg.__cache_ago = agoCalc(arg[prop]);
            }
            return arg.__cache_ago;
        };
    })
    .filter('fixLinks', function () {
        'use strict';
        return function (text) {
            if (text) {
                return text.replace(new RegExp('href="http', 'g'), 'target="_blank" href="http');
            }
            return text;
        };
    })
    .filter('titleFilter', function () {
        'use strict';
        return function (title) {
            if (title === null || title === '') {
                return 'Untitled article';
            } else {
                return title;
            }
        };
    })
    .filter('ellipsis', function () {
        'use strict';
        return function (text, length) {
            if (!text) {
                return null;
            }
            if (text.length <= length) {
                return text;
            }
            return text.substring(0, length) + '...';
        };
    })
    .filter('feedUrl', function () {
        'use strict';
        return function (feed) {
            if (feed === null) {
                return null;
            }
            if (feed.type === 'twitter') {
                return 'http://twitter.com/' + feed.url;
            }
            return feed.url;
        };
    })
    .filter('iconLink', function (izmetParameters) {
        'use strict';
        return function (arg) {
            var href;
            if (arg && arg.links) {
                for (var i = 0; i < arg.links.length; i++) {
                    var l = arg.links[i];
                    if (l.type === 'icon') {
                        href = l.href;
                        break;
                    }
                }
            }
            if (href) {
                if (href[0] === '/') {
                    href = href.substring(1);
                }
                return izmetParameters.backendUrl + href;
            }
            return null;
        };
    })
    .filter('unseenOnly', function () {
        'use strict';
        return function (tbl, filterActive) {
            if (!tbl || !filterActive) {
                return tbl;
            }
            return _.filter(tbl, function (x) {
                return !x.seen;
            });
        };
    })
    .filter('imageLink', function () {
        'use strict';
        return function (arg) {
            if (arg && arg.links) {
                for (var i = 0; i < arg.links.length; i++) {
                    var l = arg.links[i];
                    if (l.type === 'image') {
                        return l.href;
                    }
                }
            }
            return null;
        };
    });
