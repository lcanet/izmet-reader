'use strict';
/* global $ */
/* global alert */

/**
 * Module for the mobile versions
 */
angular.module('izmet', ['ngMobile', 'ngResource', 'ngRoute', 'ngSanitize', 'izmetConfig'])
    .config(['$routeProvider', '$httpProvider', 'izmetParametersProvider', '$q', function ($routeProvider, $httpProvider, izmetParametersProvider, $q) {
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

        $httpProvider.interceptors.push(function() {
            var nbRequests = 0;
            return {
                request: function (config) {
                    nbRequests++;
                    $('#ajax-loader').show();
                    return config;
                },
                response: function (response) {
                    nbRequests--;
                    if (nbRequests === 0){
                        $('#ajax-loader').hide();
                    }
                    return response;
                },
                responseError: function (err) {
                    nbRequests--;
                    if (nbRequests === 0){
                        $('#ajax-loader').hide();
                    }
                    alert(err.message);
                    return $q.reject(err);
                }
            };
        });

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
