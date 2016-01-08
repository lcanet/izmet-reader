'use strict';
/* global $ */
/* global alert */

angular.module('izmet', ['ngResource', 'ngSanitize', 'ngRoute', 'infinite-scroll', 'izmetConfig'])
    .config(['$routeProvider', '$httpProvider', '$q', function ($routeProvider, $httpProvider, $q) {
        $routeProvider.when('/', {
            templateUrl: 'views/home.html',
            controller: 'HomeCtrl'
        });
        $routeProvider.when('/search/:query', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.when('/:feedId/:articleId', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.when('/:feedId', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.otherwise({redirectTo: '/'});

        $httpProvider.interceptors.push(function () {
            var nbRequests = 0;
            return {
                request: function (config) {
                    nbRequests++;
                    $('#ajax-loader').show();
                    return config;
                },
                response: function (response) {
                    nbRequests--;
                    if (nbRequests === 0) {
                        $('#ajax-loader').hide();
                    }
                    return response;
                },
                responseError: function (err) {
                    nbRequests--;
                    if (nbRequests === 0) {
                        $('#ajax-loader').hide();
                    }
                    alert(err.message);
                    return $q.reject(err);
                }
            };
        });

    }])
    .run(['notificationService', '$timeout', function (notificationService, $timeout) {
        notificationService.start();

        $timeout(function () {
            $('.preloader').fadeOut(300, function () {
                $('#main-content').show();
            });
        }, 50);
    }])
;


