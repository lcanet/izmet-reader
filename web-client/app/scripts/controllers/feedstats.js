'use strict';

angular.module('izmet')
    .controller('FeedStatsCtrl', function ($scope, $http, $rootScope, izmetParameters) {
        function refresh(){
            $http.get(izmetParameters.backendUrl + 'feed-stats').success(function(res){
                $scope.stats = res;
            });
        }

        refresh();

        $scope.forcePoll = function(feed){
            $http.post(izmetParameters.backendUrl + 'feed/' + feed.id + '/poll')
                .success(function(){
                    refresh();
                    alert('Feed polled');
                });
        }

    });
