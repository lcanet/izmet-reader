'use strict';
/* global _ */

angular.module('izmet')
    .controller('HomeCtrl', function ($http, $scope, $routeParams, $rootScope, izmetParameters, notificationService) {
        $http.get(izmetParameters.backendUrl + 'favorites')
            .success(function(result){
                // prepare array of group of 2
                var r = _.groupBy(result, function(elt, num){
                    return Math.floor(num / 2);
                });
                r = _.values(r);

                $scope.favorites = r;
            });

        // to indicate that no feed is selected
        $rootScope.$broadcast('feedSelected', 'home');

        $scope.showAddFeed = function(){
            $rootScope.$broadcast('showAddFeedPopup');
        };

        $scope.notifEnablable = notificationService.supported && !notificationService.enabled;
        $scope.enableNotifications = function() {
            notificationService.requestStart();
        };

    });
