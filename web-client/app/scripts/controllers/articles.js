'use strict';

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams, $rootScope) {

        // pagination parameters
        var pageSize ;
        var lastOffset ;
        var endOfFeed;      // marker of end of feed

        // mode
        var currentFeedId;

        // don't do another request when scrolling events fire in reaction of page change
        var requestInflight = false;

        function getPage() {
            var resultHandler= function(result) {
                if (result.length < pageSize) {
                    endOfFeed = true;
                }
                if (!$scope.articles) {
                    $scope.articles = [];
                }
                $scope.articles = $scope.articles.concat( result);
                requestInflight = false;
            };

            if (currentFeedId === 'all') {
                $http.get('/article', {params: {limit: pageSize, offset:lastOffset}})
                    .success(resultHandler);
                requestInflight = true;
            } else if (currentFeedId !== null) {
                $http.get('/feed/' + currentFeedId + '/article', {params: {limit: pageSize, offset:lastOffset}})
                    .success(resultHandler);
                requestInflight = true;
            }
        }

        // initialisation
        currentFeedId = null;

        if ($routeParams.feedId) {

            // reset articles
            $scope.articles = null;
            $scope.currentArticle = null;
            pageSize = 100;
            lastOffset = 0;
            endOfFeed = false;

            currentFeedId = $routeParams.feedId;
            $scope.selectedFeed = null;
            if (currentFeedId !== null) {
                $http.get('/feed/' + currentFeedId).success(function(result){
                    $scope.selectedFeed = result;
                });
            }
            getPage();
        }

        $scope.getNextPage = function () {
            if (!endOfFeed && !requestInflight) {
                lastOffset += pageSize;
                getPage();
            }
        };

        // styles

        $scope.getClassForArticleHeader = function(article) {
            if (!article.read) {
                return 'unread';
            } else {
                return 'read';
            }
        };

        // actions

        $scope.selectArticle = function(article) {
            if ($scope.currentArticle === article ){
                // unselect article
                $scope.currentArticle = null;
            } else {
                $scope.currentArticle = article;
                if (article && !article.read) {
                    article.read = true;
                    // update status on server
                    $http.put('/article/' + article.id, { read: true })
                        .success(function(){
                            $rootScope.$broadcast('updateUnread', article.feed.id, { delta: -1 });
                        });
                }
                // scroll to article
                if (article){
                    $scope.$broadcast('autoscroll', article.id);
                }
            }
        };

        $scope.markAllAsRead = function(){
            if (currentFeedId === 'all') {
                $http.put('/article', { all: true })
                    .success(function(result){
                        _.each($scope.articles, function(elt){
                            elt.read = true;
                        });
                        $rootScope.$broadcast('updateUnread', null, { value: 0 });

                    });
            } else if (currentFeedId != null) {
                $http.put('/feed/' + currentFeedId + '/mark')
                    .success(function(result){
                        _.each($scope.articles, function(elt){
                            elt.read = true;
                        });
                        $rootScope.$broadcast('updateUnread', currentFeedId, { value: 0 });

                    });
            }
        };

    });
