/**
 Service that maintain a pointer to the next unread feed
 */

'use strict';

function FeedService() {


    /**
     * Get the next unread feed
     * @returns {*}
     */
    this.getNextUnread = function(feed){
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
            if (curFeed.nb_unread > 0 && found){
                return curFeed;
            }
        }
        return null;

    };


}


angular.module('izmet').service('feedService',[FeedService]);