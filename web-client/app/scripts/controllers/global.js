'use strict';

angular.module('izmet')
    .controller('GlobalCtrl', function ($scope, $rootScope) {

        // nav clavier
        function isKeyboardFocusAllowed($event) {
            return !$event.target ||
                $event.target.nodeName.toUpperCase() !== 'INPUT';
        }

        $scope.keyNavNext = function($event) {
            if (isKeyboardFocusAllowed($event)){
                $event.preventDefault();
                $rootScope.$broadcast('navigateNextArticle');
            }
        };
        $scope.keyNavPrev = function($event) {
            if (isKeyboardFocusAllowed($event)){
                $event.preventDefault();
                $rootScope.$broadcast('navigatePrevArticle');
            }
        };
        $scope.openArticle = function($event) {
            if (isKeyboardFocusAllowed($event)){
                $event.preventDefault();
                $rootScope.$broadcast('openArticleLink');
            }
        };
    });
