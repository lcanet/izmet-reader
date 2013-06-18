'use strict';

angular.module('izmet')
    .controller('FeedAddCtrl', function ($scope, $http, $rootScope) {
        $scope.showPopup = false;

        $scope.type = 'rss';

        $scope.save = function(){
            if ($scope.addForm.$valid) {
                $http.post('/feed', {type: $scope.type, url: $scope.url, poll_frequency: 120})
                    .success(function(data){
                        $scope.showPopup = false;
                        // clean
                        $scope.url = '';

                        $rootScope.$broadcast('feedAdded', data);
                    });
            }

        };

        $scope.$on('showAddFeedPopup', function(){
            $scope.showPopup = true;
        });
    });
