/**
 * Created with JetBrains WebStorm.
 * User: lc
 * Date: 16/07/13
 * Time: 20:59
 * To change this template use File | Settings | File Templates.
 */
'use strict';

function FeedService($http) {

    var feedService = {
        feeds: []
    };


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

    return feedService;

}


angular.module('izmet').service('feedService',FeedService);