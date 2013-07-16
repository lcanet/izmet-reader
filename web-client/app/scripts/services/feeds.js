'use strict';
/* global _ */

function FeedService($http, izmetParameters, $rootScope, $location) {

    var feedService = {
        feeds: [],
        totalUnseen: 0
    };

    /**
     * Load feeds
     */
    feedService.loadFeeds = function() {

        $http.get(izmetParameters.backendUrl + 'feed').success(function(result){
            feedService.feeds = result;
            $rootScope.$broadcast('updateTotalUnseen');
        });

    };

    $rootScope.$on('updateUnseen', function(evt, feedId, arg) {
        var matching = _.filter(feedService.feeds, function(elt) { return feedId === null || elt.id == feedId; });
        _.each(matching, function(feed) {
            if (arg.delta) {
                feed.nb_unseen += arg.delta;
            } else {
                feed.nb_unseen = arg.value;
            }
        });
        $rootScope.$emit('updateTotalUnseen');
    });


    $rootScope.$on('updateTotalUnseen', function(){
        feedService.totalUnseen = _.reduce(feedService.feeds,
            function(sum, feed) {
                return sum + feed.nb_unseen;
            }, 0);
    });


    /**
     * Get the next unread feed
     * @returns {*}
     */
    feedService.getNextUnseen = function(feed){
        if (!this.feeds){
            return null;
        }

        var found = false;
        for (var i = 0; i < this.feeds.length; i++){
            var curFeed = this.feeds[i];
            if (curFeed.id === feed.id) {
                found = true;
                continue;
            }
            if (curFeed.nb_unseen > 0 && found){
                return curFeed;
            }
        }
        return null;
    };

    /**
     * Add a new feed and switch current view to it
     * @param feed
     */
    feedService.addFeed = function(feed) {
        feedService.feeds.push(feed);
        $location.path('/' + feed.id);
    };

    /**
     * Delete the given feed
     * @param feed
     */
    feedService.deleteFeed = function(feed){
        var elt = _.find(feedService.feeds, function(e){return e.id === feed.id; });
        if (elt){
            var idx = feedService.feeds.indexOf(elt);
            feedService.feeds.splice(idx, 1);
        }
    };


    // on startup load feeds
    feedService.loadFeeds();

    return feedService;
}


angular.module('izmet').service('feedService',FeedService);