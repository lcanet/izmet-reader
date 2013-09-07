'use strict';


angular.module('izmet').service('notificationService',function ($http, $timeout, izmetParameters, $filter, $location) {

    var POLL_DELAY = 30000;

    var service = {
    };

    var lastArticle = null;
    var iconLinkFn = $filter('iconLink');


    function pushNotification(art) {
        var link = iconLinkFn(art.feed);
        var n = window.webkitNotifications.createNotification(link,
            art.feed.name,
            art.title);
        n.onclick = function(){
            $location.path('/' + art.feed.id + '/' + art.id);
        };
        n.show();

    }

    function articlesReceived(data){
        if (data === null || data.length === 0){
            return;
        }
        var art = data[0];

        if (lastArticle != null && art.id > lastArticle.id) {
            pushNotification(art);
        }
        lastArticle = art;
    }

    var poll = function() {
        $http.get(izmetParameters.backendUrl + 'article?unseenOnly=true&limit=2')
            .success(function(data){
                articlesReceived(data);
            });
        $timeout(poll, POLL_DELAY);
    };

    service.supported = false;
    service.enabled = false;
    service.started = false;


    service.checkNotificationSupported = function() {
        if (!window.webkitNotifications) {
            this.supported = false;
            return false;
        } else {
            this.supported = true;
        }

        if (window.webkitNotifications.checkPermission() === 0) { // 0 is PERMISSION_ALLOWED
            service.enabled = true;
            return true;
        } else {
            service.enabled = false;
            return false;
        }
    };


    function doStart() {
        $timeout(poll, POLL_DELAY);
        service.started = true;
    }

    service.start = function(){
        service.checkNotificationSupported();
        if (service.supported && service.enabled) {
            doStart();
        }
    };

    service.requestStart = function() {
        window.webkitNotifications.requestPermission();
        doStart();
    };

    return service;
});

