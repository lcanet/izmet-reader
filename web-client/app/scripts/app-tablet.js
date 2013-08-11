'use strict';
/* global $ */
/* global alert */

/**
 * Module for the mobile versions
 */
angular.module('izmet', ['ngMobile', 'ngResource', 'ngSanitize', 'izmetConfig'])
    .config(['$routeProvider', '$httpProvider', 'izmetParametersProvider', function ($routeProvider, $httpProvider, izmetParametersProvider) {
        $routeProvider.when('/', {
            templateUrl: 'views/home-tablet.html'
        });
        $routeProvider.when('/:feedId', {
            templateUrl: 'views/articles-tablet.html',
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

        // pre-configure app
        izmetParametersProvider.defaults.mobile = false;
    }])
    .run(['$location', 'izmetParameters', function($location, izmetParameters){
        // for the phonegap version
        var protocol = $location.protocol();
        if (protocol === 'file') {
            izmetParameters.backendUrl = 'http://reader.tekila.org/';
        }

    }])
;
