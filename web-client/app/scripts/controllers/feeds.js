'use strict';
/* global _ */

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope, $location, feedService, izmetParameters) {
        $scope.filterText = '';
        $scope.totalUnread = 0;

        $http.get(izmetParameters.backendUrl + 'feed').success(function(result){
            $scope.feeds = result;
            $rootScope.$broadcast('updateTotalUnread');

            // send to feedservice
            feedService.feeds = result;
        });

        $scope.$on('updateUnread', function(evt, feedId, arg) {
            var matching = _.filter($scope.feeds, function(elt) { return feedId === null || elt.id == feedId; });
            _.each(matching, function(feed) {
                if (arg.delta) {
                    feed.nb_unread += arg.delta;
                } else {
                    feed.nb_unread = arg.value;
                }
            });
            $scope.$emit('updateTotalUnread');
        });


        $scope.$on('updateTotalUnread', function(){
            $scope.totalUnread = _.reduce($scope.feeds,
                function(sum, feed) {
                    return sum + feed.nb_unread;
                }, 0);
        });

        var currentlySelectedFeed = null;
        $scope.$on('feedSelected', function($evt, x){
            currentlySelectedFeed = x;
        });

        $scope.getClassForFeed = function (feed) {
            return feed.nb_unread > 0 ? 'unread' :'';
        };
        $scope.getRowClassForFeed = function(feed){
            if (currentlySelectedFeed !== null && currentlySelectedFeed.id === feed.id){
                return 'current';
            }
            return '';
        };
        $scope.getClassForAllArticles = function () {
            return $scope.totalUnread > 0 ? 'unread' : '';
        };

        $scope.showAddFeed = function(){
            $rootScope.$broadcast('showAddFeedPopup');
        };

        $scope.$on('feedAdded', function($evt, feed){
            $scope.feeds.push(feed);        // we should sort too
            $location.path('/' + feed.id);
        });
        $scope.$on('feedDeleted', function($evt, feed){
            var elt = _.find($scope.feeds, function(e){return e.id === feed.id; });
            if (elt){
                var idx = $scope.feeds.indexOf(elt);
                $scope.feeds.splice(idx, 1);
            }
        });
    });
