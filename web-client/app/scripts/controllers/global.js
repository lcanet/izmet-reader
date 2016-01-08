'use strict';

angular.module('izmet')
    .controller('GlobalCtrl', function ($scope, $rootScope, $location) {

        // nav clavier
        function isKeyboardFocusAllowed($event) {
            return !$event.target ||
                $event.target.nodeName.toUpperCase() !== 'INPUT';
        }

        $scope.onKeyDown = function ($event) {
            if (!isKeyboardFocusAllowed($event)) {
                return;
            }

            switch ($event.keyCode) {
            case 72:
                $event.preventDefault();
                $location.path('/');
                break;
            case 74:
                $event.preventDefault();
                $rootScope.$broadcast('navigateNextArticle');
                break;
            case 75:
                $event.preventDefault();
                $rootScope.$broadcast('navigatePrevArticle');
                break;

            case 79:
                $event.preventDefault();
                $rootScope.$broadcast('openArticleLink');
                break;

            case 83:
                $event.preventDefault();
                $rootScope.$broadcast('starCurrentArticle');
                break;
            }
        };

    });
