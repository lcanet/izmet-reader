'use strict';
/* global $ */
/* global alert */

angular.module('izmet', ['ngResource', 'ngSanitize', 'infinite-scroll'])
    .config(function ($routeProvider, $httpProvider) {
        $routeProvider.when('/:feedId', {
            templateUrl: 'views/articles.html',
            controller: 'ArticlesCtrl'
        });
        $routeProvider.otherwise({redirectTo: '/'});

        $httpProvider.defaults.transformRequest.push(function(d){
            $('#ajax-loader').show();
            return d;
        });
        $httpProvider.responseInterceptors.push(function($q){
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
        });

    });
