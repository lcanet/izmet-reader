'use strict';
/* global _ */
/* global confirm */

angular.module('izmet')
    .controller('HomeCtrl', function ($http, $scope, $routeParams, $rootScope, $location) {
        $http.get('/favorites')
            .success(function(result){
                // prepare array of group of 2
                var r = _.groupBy(result, function(elt, num){
                    return Math.floor(num / 2);
                });
                r = _.values(r);
                $scope.favorites = r;
            });

        // to indicate that no feed is selected
        $rootScope.$broadcast('feedSelected', null);



    });
