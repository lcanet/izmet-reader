'use strict';

angular.module('izmet', ['ngResource'])
    .config(function ($routeProvider) {
        $routeProvider.when('/:feedId', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.otherwise({redirectTo: '/'});
    });
