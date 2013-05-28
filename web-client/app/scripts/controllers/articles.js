'use strict';

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams) {

        // pagination parameters
        var pageSize ;
        var lastOffset ;
        var endOfFeed;      // marker of end of feed
        var currentFeedId;

        // don't do another request when scrolling events fire in reaction of page change
        var requestInflight = false;

        function getPage() {
            var resultHandler= function(result) {
                if (result.length < pageSize) {
                    endOfFeed = true;
                }
                $scope.articles = $scope.articles.concat( result);
                requestInflight = false;
            };

            if (currentFeedId != null) {
                $http.get('/feed/' + currentFeedId + '/article', {params: {limit: pageSize, offset:lastOffset}})
                    .success(resultHandler);
            } else {
                $http.get('/article', {params: {limit: pageSize, offset:lastOffset}})
                    .success(resultHandler);
            }
            requestInflight = true;
        }

        // initialisation


        if ($routeParams.feedId) {
            // reset articles
            $scope.articles = [];
            $scope.currentArticle = null;
            pageSize = 100;
            lastOffset = 0;
            endOfFeed = false;

            currentFeedId = $routeParams.feedId;
            if (currentFeedId == 'all') {
                currentFeedId = null;
            }
            console.log("InitRP " + currentFeedId);

            $scope.selectFeed = null;
            if (currentFeedId != null) {
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
        $scope.selectArticle = function(article) {
            if ($scope.currentArticle === article ){
                // unselect article
                $scope.currentArticle = null;
            } else {
                $scope.currentArticle = article;
                if (article && !article.read) {
                    article.read = true;
                    // TODO: persist read state
                }
            }
        };

    });
