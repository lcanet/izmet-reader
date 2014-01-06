'use strict';
/* global _ */
/* global confirm */
/* global alert */

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams, $rootScope, $location, $q,
                                          izmetParameters, feedService, offlineService) {

        // pagination parameters
        var pageSize ;
        var lastOffset ;
        var endOfFeed;      // marker of end of feed

        // don't do another request when scrolling events fire in reaction of page change
        $scope.requestInflight = false;

        // mode
        $scope.currentFeedId = null;

        // fetch only unread articles
        $scope.unseenOnly = true;

        // order
        $scope.order = 'asc';

        var articleIdToSelect = null;

        function getPage() {
            var resultHandler= function(result) {
                var data = result.data;

                if (data.length < pageSize) {
                    endOfFeed = true;
                }
                if (!$scope.articles) {
                    $scope.articles = [];
                }
                $scope.articles = $scope.articles.concat( data);
                $scope.requestInflight = false;

                // article to select (with url parameter)
                if (articleIdToSelect){
                    // try to find article
                    var articleToSelect = _.find($scope.articles, function(a){
                        return ('' + a.id) == $routeParams.articleId;
                    });
                    if (articleToSelect) {
                        $scope.selectArticle(articleToSelect);
                    }

                    // it's ok, do not test it next time
                    articleIdToSelect = null;

                }
                // article to select in mobile
                if (izmetParameters.mobile &&
                    $scope.currentArticle === null &&
                    $scope.articles.length > 0) {
                    $scope.selectArticle($scope.articles[0]);
                }
            };
            var faultHandler = function(){
                alert('Cannot get articles');
            };

            var unseenOnly = $scope.unseenOnly;
            var p;

            // load offline or not
            if (offlineService.hasOfflineSupport &&
                !offlineService.hasNetwork() &&
                offlineService.offlineData !== null) {

                var defer = $q.defer();
                var subList = offlineService.offlineData.articles;

                // filter unseen
                subList = _.filter(subList, function(a) { return !a.seen; });

                if ($scope.currentFeedId !== 'all' && $scope.currentFeedId !== null) {
                    subList = _.filter(subList, function(a) { return a.feed.id == $scope.currentFeedId; });
                }
                if ($scope.order == 'desc') {
                    subList.reverse();
                }

                subList = subList.slice(lastOffset, Math.min(lastOffset+pageSize, subList.length));
                defer.resolve({data: subList});
                p = defer.promise;

            } else {
                if ($scope.searchQuery) {
                    p = $http.get(izmetParameters.backendUrl + 'article', {params: {
                        limit: pageSize,
                        offset:lastOffset,
                        q: $scope.searchQuery,
                        order: $scope.order
                    }});
                } else if ($scope.currentFeedId === 'all') {
                    p = $http.get(izmetParameters.backendUrl + 'article', {params: {
                        limit: pageSize,
                        offset:lastOffset,
                        unseenOnly: unseenOnly,
                        order: $scope.order
                    }});
                } else if ($scope.currentFeedId === 'starred') {
                    p = $http.get(izmetParameters.backendUrl + 'article', {params: {
                        limit: pageSize,
                        offset:lastOffset,
                        unseenOnly: false,
                        starred: true,
                        order: $scope.order
                    }});
                } else if ($scope.currentFeedId !== null) {
                    p = $http.get(izmetParameters.backendUrl + 'feed/' + $scope.currentFeedId + '/article', {params: {
                        limit: pageSize,
                        offset: lastOffset,
                        unseenOnly: unseenOnly,
                        order: $scope.order
                    }});
                }
            }
            if (p) {
                p.then(resultHandler, faultHandler);
                $scope.requestInflight = true;
            }
        }

        function resetArticles() {
            $scope.articles = null;
            $scope.currentArticle = null;
            pageSize = 50;
            lastOffset = 0;
            endOfFeed = false;
            getPage();
        }


        // initialisation : from feed

        if ($routeParams.feedId) {

            $scope.currentFeedId = $routeParams.feedId;
            $scope.selectedFeed = null;
            $scope.nextUnseenFeed = null;
            $rootScope.$broadcast('feedSelected', $scope.currentFeedId);

            // fetch informations about current feed
            if ($scope.currentFeedId !== null &&
                    $scope.currentFeedId !== 'all' &&
                    $scope.currentFeedId != 'starred') {
                $scope.selectedFeed = feedService.getFeed($scope.currentFeedId);
                // get the next unseen feed
                $scope.nextUnseenFeed = feedService.getNextUnseen($scope.selectedFeed);
            }

            articleIdToSelect = $routeParams.articleId;
            resetArticles();

        } else if ($routeParams.query) {
            // reset articles
            $scope.searchQuery = $routeParams.query;
            $scope.selectedFeed = null;
            resetArticles();
        }

        $scope.getNextPage = function () {
            if (!endOfFeed && !$scope.requestInflight) {
                lastOffset += pageSize;
                getPage();
            }
        };
        // styles

        $scope.getClassForArticleHeader = function(article) {
            if (!article.seen) {
                return 'unread';
            } else {
                return 'read';
            }
        };

        // actions

        $scope.selectArticle = function(article) {
            if ($scope.currentArticle === article ){
                // unselect article (not on mobile)
                if (!izmetParameters.mobile) {
                    $scope.currentArticle = null;
                }
            } else {
                $scope.currentArticle = article;
                if (article && !article.seen) {
                    article.seen = true;

                    // update status on server
                    if (offlineService.hasOfflineSupport &&
                        !offlineService.hasNetwork()) {

                        offlineService.addPendingAction({id: article.id, seen: true, read:true });
                        $rootScope.$broadcast('updateUnseen', article.feed.id, { delta: -1 });
                    } else {
                        $http.put(izmetParameters.backendUrl + 'article/' + article.id, { seen: true, read:true })
                        .success(function(){
                            $rootScope.$broadcast('updateUnseen', article.feed.id, { delta: -1 });
                        });
                    }
                }
                // scroll to article
                if (article){
                    $scope.$broadcast('autoscroll', article.id);
                }
            }
        };

        $scope.markAllAsSeen = function(){
            if ($scope.currentFeedId === 'all' || $scope.currentFeedId === 'starred') {
                return $http.put(izmetParameters.backendUrl + 'article', { all: true })
                    .success(function(){
                        _.each($scope.articles, function(elt){
                            elt.seen = true;
                        });
                        $rootScope.$broadcast('updateUnseen', null, { value: 0 });

                    });
            } else if ($scope.currentFeedId !== null) {
                return $http.put(izmetParameters.backendUrl +  'feed/' + $scope.currentFeedId + '/article')
                    .success(function(){
                        _.each($scope.articles, function(elt){
                            elt.seen = true;
                        });
                        $rootScope.$broadcast('updateUnseen', $scope.currentFeedId, { value: 0 });

                    });
            }
        };

        $scope.toggleUnseen = function(val) {
            $scope.unseenOnly = val;
            // reset
            resetArticles();
        };

        // nav clavier
        $scope.$on('navigateNextArticle', function(){
            if ($scope.currentArticle !== null && $scope.articles !== null){
                var idx = $scope.articles.indexOf($scope.currentArticle);
                if (idx != -1) {
                    if (idx < ($scope.articles.length - 1)) {
                        $scope.selectArticle($scope.articles[idx+1]);
                    } else {
                        $scope.selectArticle($scope.currentArticle);
                    }

                    // anticipate next page of scroll (when less than 5 articles are still to display)
                    if (idx > ($scope.articles.length - 5)) {
                        $scope.getNextPage();
                    }
                }
            }
        });
        $scope.$on('navigatePrevArticle', function(){
            if ($scope.currentArticle !== null && $scope.articles !== null){
                var idx = $scope.articles.indexOf($scope.currentArticle);
                if (idx != -1) {
                    if (idx > 0) {
                        $scope.selectArticle($scope.articles[idx-1]);
                    } else {
                        $scope.selectArticle($scope.currentArticle);
                    }
                }
            }
        });
        $scope.$on('openArticleLink', function(){
            if ($scope.currentArticle && $scope.currentArticle.url) {
                window.open($scope.currentArticle.url, '_blank');
            }
        });
        $scope.$on('starCurrentArticle', function(){
            if ($scope.currentArticle) {
                $scope.toggleStar($scope.currentArticle);
            }
        });

        $scope.deleteFeed = function() {
            if (confirm('Do you want to delete feed ?')) {
                $http.delete(izmetParameters.backendUrl + 'feed/' + $scope.selectedFeed.id)
                    .success(function(){
                        feedService.deleteFeed($scope.selectedFeed);
                        $location.path('/');
                    });
            }
        };

        $scope.scrollToTop = function($event) {
            $event.stopPropagation();
            $scope.currentArticle = null;
            window.scrollTo(0);

        };

        $scope.markReadAndGoNext = function() {
            var p = $scope.markAllAsSeen();
            if (p && $scope.nextUnseenFeed) {
                p.then(function(){
                    $location.path('/' + $scope.nextUnseenFeed.id);
                });
            }
        };

        $scope.toggleOrder = function() {
            if ($scope.order == 'asc') {
                $scope.order = 'desc';
            } else {
                $scope.order = 'asc';
            }
            resetArticles();
        };
        $scope.getOrderIconClass = function(){
            return $scope.order == 'asc' ? 'icon-arrow-down' : 'icon-arrow-up';
        };

        /* ********************** gestion stars ************ */
        $scope.isArticledStarred = function(a){
            return a && a.starred ? 'starred':'';
        };
        $scope.toggleStar = function(a){
            a.starred = !a.starred;

            // update status on server
            if (offlineService.hasOfflineSupport &&
                !offlineService.hasNetwork()) {
                offlineService.addPendingAction({id: a.id, starred: a.starred});
            } else {
                $http.put(izmetParameters.backendUrl + 'article/' + a.id, { starred: a.starred });
            }


        };

    });
