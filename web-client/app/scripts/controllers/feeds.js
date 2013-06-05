'use strict';
/* global _ */

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope) {
        $scope.totalUnread = 0;

        $http.get('/feed').success(function(result){
            $scope.feeds = result;
            $rootScope.$broadcast('updateTotalUnread');
        });

        $scope.$on('updateUnread', function(evt, feedId, delta) {
            console.log("UpdateNbUnread " + feedId + " " + delta);
            var feed = _.find($scope.feeds, function(elt) { return elt.id == feedId; });
            if (feed) {
                console.log("Got", feed);
                feed.nb_unread += delta;
                $scope.$emit('updateTotalUnread');
            }
        });

        $scope.$on('updateTotalUnread', function(){
            $scope.totalUnread = _.reduce($scope.feeds,
                function(sum, feed) {
                    return sum + feed.nb_unread;
                }, 0);
        });

        $scope.getClassForFeed = function (feed) {
            return feed.nb_unread > 0 ? 'unread' : '';
        };
        $scope.getClassForAllArticles = function () {
            return $scope.totalUnread > 0 ? 'unread' : '';
        };
    });
