/* global moment */

function agoCalc(arg) {
    'use strict';
    // don't print 'ago' if more than 1 day
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
            if (text){
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
    .filter('iconLink', function () {
        'use strict';
        return function (arg) {
            if (arg && arg.links) {
                for (var i = 0; i < arg.links.length ; i++) {
                    var l = arg.links[i];
                    if (l.type === 'icon') {
                        return l.href;
                    }
                }
            }
            return null;
        };
    });
