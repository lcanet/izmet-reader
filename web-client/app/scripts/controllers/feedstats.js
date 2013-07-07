'use strict';

angular.module('izmet')
    .controller('FeedStatsCtrl', function ($scope, $http, $rootScope, izmetParameters) {
        $http.get('/feed-stats').success(function(res){
            $scope.stats = res;
        });

    });
