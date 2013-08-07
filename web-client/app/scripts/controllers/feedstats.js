'use strict';
/* global alert */

angular.module('izmet')
    .controller('FeedStatsCtrl', function ($scope, $http, $rootScope, izmetParameters) {
        function refresh(){
            $http.get(izmetParameters.backendUrl + 'feed-stats').success(function(res){
                $scope.stats = res;
                // calculate global max
                var globalMax = 0;
                angular.forEach(res, function(fs){
                    var data = JSON.parse(fs.articles_stats);
                    fs.articles_stats = data;
                    angular.forEach(data, function(i){
                        globalMax = Math.max(globalMax, i);
                    });
                });
                $scope.globalMax = globalMax;
            });
        }

        refresh();

        $scope.forcePoll = function(feed){
            $http.post(izmetParameters.backendUrl + 'feed/' + feed.id + '/poll')
                .success(function(){
                    refresh();
                    alert('Feed polled');
                });
        };

    });
