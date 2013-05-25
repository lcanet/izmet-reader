'use strict';

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope) {
        $http.get('/feed').success(function(result){
            $scope.feeds = result;
        });

        $scope.getClassForFeed = function(feed){
            return feed.nb_unread > 0 ? 'unread' : '';
        }
    });
