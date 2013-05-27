/* Filters */
angular.module('izmet')
    .filter('ago', function() {
        return function(arg) {
            // don't print 'ago' if more than 1 day
            var m = moment(arg);
            if (m.isBefore(moment().subtract('d', 10))) {
                return m.format('D MMM YYYY');
            } else {
                return m.fromNow();
            }


        }
    });
