'use strict';

angular.module('izmet')
    .controller('FeedAddCtrl', function ($scope, $http, $rootScope, izmetParameters, feedService) {
        $scope.showPopup = false;

        $scope.type = 'rss';

        $scope.save = function(){
            if ($scope.addForm.$valid) {
                $http.post(izmetParameters.backendUrl + 'feed', {type: $scope.type, url: $scope.url, poll_frequency: 120})
                    .success(function(data, status, headers){
                        $scope.showPopup = false;
                        // clean
                        $scope.url = '';

                        // go get feed
                        $http.get(headers('location')).success(function(feed) {
                            feedService.addFeed(feed);
                        });

                    });
            }

        };

        $scope.$on('showAddFeedPopup', function(){
            $scope.showPopup = true;
        });
    });
