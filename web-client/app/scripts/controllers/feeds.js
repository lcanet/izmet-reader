'use strict';

angular.module('izmet')
    .controller('FeedsCtrl', function ($scope, $http, $rootScope) {
        $http.get('/feed').success(function(result){
            $scope.feeds = result;
        });

    });
