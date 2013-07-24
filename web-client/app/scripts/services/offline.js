'use strict';
/* global _ */

function OfflineService($http, izmetParameters, $rootScope, $location, $log, $timeout) {

    var CONNECTIVITY_CHANGE_POLL_DELAY = 2000;

    var service = {
        networkState: null
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
                }

            };

            $timeout(function checkConnectivityTimerFn() {
                checkConnectivityFunction();
                $timeout(checkConnectivityTimerFn, CONNECTIVITY_CHANGE_POLL_DELAY);
            }, 0);

        }
    };

    /**
     *
     * @returns {boolean}
     */
    service.hasNetwork = function(){
        return this.networkState !== 'none';
    };



    return service;
}


angular.module('izmet').service('offlineService',OfflineService);