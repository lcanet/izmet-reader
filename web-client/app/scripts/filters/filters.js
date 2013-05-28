/* global moment */

function agoCalc(arg) {
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
            if (arg.__cache_ago == null) {
                arg.__cache_ago = agoCalc(arg[prop]);
            }
            return arg.__cache_ago;
        };
    });
