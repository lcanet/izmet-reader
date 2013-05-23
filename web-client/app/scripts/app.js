'use strict';

angular.module('izmet', [])
    .config(function ($routeProvider) {
        $routeProvider.when('/:feedId', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.otherwise({redirectTo: '/'});
    });
