'use strict';

function OfflineService() {

    var service = {
        hasOfflineSupport: false
    };


    return service;
}

angular.module('izmet').service('offlineService',OfflineService);
