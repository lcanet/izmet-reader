'use strict';
/* global _ */

function OfflineMobileService($http, izmetParameters, $rootScope, $location, $log, $timeout, $q) {

    var CONNECTIVITY_CHANGE_POLL_DELAY = 2000;
    var LOCALSTORAGE_CACHE_KEY = 'izmetCache';

    var service = {
        networkState: null,
        offlineData: null,
        hasOfflineSupport: true,

        pendingActions: []
    };

    /**
     *
     */
    service.start = function() {
        // check online/offline
        if (izmetParameters.mobile && navigator && navigator.network) {
            console.log("Registering connectivity change event");

            var checkConnectivityFunction = function(){
                var newNetworkState = navigator.network.connection.type;
                if (service.networkState === null || newNetworkState !== service.networkState) {
                    $log.log("NEW NETWORK STATE IS " + newNetworkState);
                    service.networkState = newNetworkState;

                    $rootScope.$broadcast('networkStateChange', newNetworkState);

                    // clean up pending actions
                    if (service.hasNetwork()) {
                        service.pushPendingActions();
                    }
                }

            };

            $timeout(function checkConnectivityTimerFn() {
                checkConnectivityFunction();
                $timeout(checkConnectivityTimerFn, CONNECTIVITY_CHANGE_POLL_DELAY);
            }, 0);

        }

        // read data from localStorage
        if (izmetParameters.mobile) {
            service.loadLocalData();
        }

    };

    /**
     *
     * @returns {boolean}
     */
    service.hasNetwork = function(){
        return this.networkState !== 'none';
    };

    function checkLocalStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    service.loadLocalData = function(){
        if (!checkLocalStorage()) {
            alert("No local storage");
            return null;
        }
        var str = localStorage.getItem(LOCALSTORAGE_CACHE_KEY);
        if (str){
            service.offlineData = JSON.parse(str);
        }
    };

    service.addPendingAction = function(act) {
        service.pendingActions.push(act);
    };

    /**
     * Load data and push all changes
     */
    service.synchroniseData = function() {
        service.pushPendingActions().then(service.loadRemoteData, service.loadRemoteData);
    };

    service.pushPendingActions = function() {
        var defer = $q.defer();
        if (service.pendingActions != null && service.pendingActions.length > 0) {
            console.log("About to push ", service.pendingActions);

            $http.put(izmetParameters.backendUrl + 'article',
                service.pendingActions)
                .success(function(){
                    service.pendingActions = [];
                    defer.resolve();
                })
                .error(function(err){
                    console.log("Error", err);
                    alert("Cannot push actions");
                    defer.reject();
                });

        } else {
            defer.resolve();
        }
        return defer.promise;
    };


    service.loadRemoteData = function() {
        service.offlineData = {};
        service.offlineData.syncDate = new Date();

        $rootScope.$broadcast("offlineDataSyncStart");

        // load feeds
        var currentArticlesIndex = 0;

        var p = $http.get(izmetParameters.backendUrl + 'feed');
        p = p.then(function(response){
            service.offlineData.feeds = response.data;

            var articles = [];

            // go fetch articles
            var def = $q.defer();
            function fetchArticles(stop){
                if (stop){
                    def.resolve(articles);
                } else {

                    $http.get(izmetParameters.backendUrl + 'article',
                        {params: {limit: 100, offset:currentArticlesIndex, unseenOnly: true}})
                        .success(function(data){
                            console.log("Fetched articles @ " + currentArticlesIndex);
                            articles = articles.concat(data);
                            currentArticlesIndex += 100;

                            // publish progress
                            $rootScope.$broadcast("offlineDataSyncProgress", articles.length);

                            fetchArticles(data.length === 0);
                        });

                }
            }
            fetchArticles(false);
            return def.promise;
        });
        p = p.then(function(articles){
            service.offlineData.articles = articles;

            // save to LS
            if (checkLocalStorage()) {
                var jsonData = JSON.stringify(service.offlineData);
                try {
                    localStorage.setItem(LOCALSTORAGE_CACHE_KEY, jsonData);
                } catch (e){
                    alert("Cannot save to local storage", e);
                }
            }

            $rootScope.$broadcast("offlineDataSyncEnd", service.offlineData);
        });
    };
    return service;
}

angular.module('izmet').service('offlineService',OfflineMobileService);
