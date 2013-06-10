'use strict';

angular.module('izmet')
    .controller('GlobalCtrl', function ($scope, $rootScope) {

        // nav clavier

        $scope.keyNavNext = function($event) {
            $event.preventDefault();
            $rootScope.$broadcast('navigateNextArticle');
        };
        $scope.keyNavPrev = function($event) {
            $event.preventDefault();
            $rootScope.$broadcast('navigatePrevArticle');
        };

    });
