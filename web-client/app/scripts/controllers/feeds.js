'use strict';

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $resource) {
        var Feed = $resource('/feed/:id', {id: '@id'});

       $scope.feeds = Feed.query();

        $scope.getClassForFeed = function(feed){
            return feed.nb_unread > 0 ? 'unread' : '';
        }
    });
