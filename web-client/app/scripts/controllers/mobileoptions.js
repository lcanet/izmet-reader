'use strict';
/* global alert */

angular.module('izmet')
    .controller('MobileOptionsCtrl', function ($scope, offlineService, $rootScope) {

        $scope.syncLabel = null;

        $scope.launchSync = function(){
            offlineService.synchroniseData();
        };

        $scope.getStyleForConnectivity = function() {
            return { 'background-color':  $scope.online ? '#00ff00' : '#ff0000' };
        };
        $scope.getIconClassForConnectivity = function() {
            return $scope.online ? 'icon-signal' : 'icon-off';
        };
        $rootScope.$on('offlineDataSyncStart', function() {
            $scope.syncLabel = 'started';
        });
        $rootScope.$on('offlineDataSyncProgress', function(ev, prog) {
            $scope.syncLabel = prog + ' ...';
        });
        $rootScope.$on('offlineDataSyncEnd', function() {
            $scope.syncLabel = null;
        });

        $scope.online = offlineService.hasNetwork();
        $rootScope.$on('networkStateChange', function(){
            $scope.online = offlineService.hasNetwork();
        });

        $scope.showLastUpdate = function(){
            if (offlineService.hasOfflineSupport) {
                if (offlineService.offlineData === null) {
                    alert('No offline data');
                } else {
                    alert('Last update : ' + offlineService.offlineData.syncDate.toLocaleString());
                }
            }
        };

    });

