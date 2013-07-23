'use strict';
/* global _ */

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope, $location, feedService) {
        $scope.filterText = '';

        $scope.feedData = feedService;

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
            return $scope.feedData.totalUnseen > 0 ? 'unread' : '';
        };

        $scope.showAddFeed = function(){
            $rootScope.$broadcast('showAddFeedPopup');
        };

    });
