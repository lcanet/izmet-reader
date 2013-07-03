'use strict';
/* global _ */

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope, $location, feedService, izmetParameters) {
        $scope.filterText = '';
        $scope.totalUnseen = 0;

        $http.get(izmetParameters.backendUrl + 'feed').success(function(result){
            $scope.feeds = result;
            $rootScope.$broadcast('updateTotalUnseen');

            // send to feedservice
            feedService.feeds = result;
        });

        $scope.$on('updateUnseen', function(evt, feedId, arg) {
            var matching = _.filter($scope.feeds, function(elt) { return feedId === null || elt.id == feedId; });
            _.each(matching, function(feed) {
                if (arg.delta) {
                    feed.nb_unseen += arg.delta;
                } else {
                    feed.nb_unseen = arg.value;
                }
            });
            $scope.$emit('updateTotalUnseen');
        });


        $scope.$on('updateTotalUnseen', function(){
            $scope.totalUnseen = _.reduce($scope.feeds,
                function(sum, feed) {
                    return sum + feed.nb_unseen;
                }, 0);
        });

        var currentlySelectedFeedId = null;
        $scope.$on('feedSelected', function($evt, x){
            currentlySelectedFeedId = x;
        });

        $scope.getClassForFeed = function (feed) {
            return feed.nb_unseen > 0 ? 'unread' :'';
        };
        $scope.getRowClassForFeed = function(feed){
            if (_.isString(feed)) {
                if (currentlySelectedFeedId !== null && currentlySelectedFeedId === feed){
                    return 'current';
                }
            } else {
                if (currentlySelectedFeedId !== null && currentlySelectedFeedId === feed.id.toString()){
                    return 'current';
                }
            }
            return '';
        };
        $scope.getClassForAllArticles = function () {
            return $scope.totalUnseen > 0 ? 'unseen' : '';
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
