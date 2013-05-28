'use strict';

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope) {
        $scope.totalUnread = 0;

        $http.get('/feed').success(function(result){
            $scope.feeds = result;
            $rootScope.$broadcast('updateTotalUnread');
        });

        $scope.$on('updateTotalUnread', function(){
            // TODO: use underscore
            var total = 0;
            for (var i = 0; i < $scope.feeds.length; i++) {
                total += $scope.feeds[i].nb_unread;
            }
            $scope.totalUnread = total;
        });

        $scope.getClassForFeed = function (feed) {
            return feed.nb_unread > 0 ? 'unread' : '';
        };
        $scope.getClassForAllArticles = function () {
            return $scope.totalUnread > 0 ? 'unread' : '';
        }
    });
