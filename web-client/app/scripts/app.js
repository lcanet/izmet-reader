'use strict';
/* global $ */
/* global alert */

angular.module('izmet', ['ngResource', 'ngSanitize', 'infinite-scroll', 'ui.keypress', '$strap', 'izmetConfig'])
    .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
        $routeProvider.when('/', {
            templateUrl: 'views/home.html',
            controller: 'HomeCtrl'
        });
        $routeProvider.when('/stats', {
            templateUrl: 'views/feed-stats.html',
            controller: 'FeedStatsCtrl'
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

        $httpProvider.defaults.transformRequest.push(function(d){
            $('#ajax-loader').show();
            return d;
        });
        $httpProvider.responseInterceptors.push(['$q', function($q){
            return function(promise){
                return promise.then(function(res){
                    $('#ajax-loader').hide();
                    if (res.data.error === true) {
                        alert(res.data.message);
                        return $q.reject(res);
                    }
                    return res;
                }, function(res){
                    $('#ajax-loader').hide();
                    alert('network error');
                    return $q.reject(res);
                });
            };
        }]);

    }])
    .run(['notificationService', '$timeout', function(notificationService, $timeout) {
        notificationService.start();

        $timeout(function(){
            $(".preloader").fadeOut(300, function(){
                $("#main-content").show();
            });
        }, 50);
    }])
;


