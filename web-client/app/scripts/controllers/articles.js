'use strict';

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams) {

        // pagination parameters
        var pageSize ;
        var lastOffset ;

        function getArticlesOfFeed(feed){
            $http.get('/feed/' + feed.id + '/article', {params: {limit: pageSize, offset:lastOffset}})
                .success(function(result){
                    $scope.articles = $scope.articles.concat( result);
                });
        }

        function getAllArticles(){
            $http.get('/article', {params: {limit: pageSize, offset:lastOffset}})
                .success(function(result){
                    $scope.articles = $scope.articles.concat( result);
                });
        }

        // initialisation

        if ($routeParams.feedId) {
            // reset articles
            $scope.articles = [];
            $scope.currentArticle = null;
            pageSize = 100;
            lastOffset = 0;

            if ($routeParams.feedId !== 'all'){
                $http.get('/feed/' + $routeParams.feedId).success(function(result){
                    $scope.selectedFeed = result;
                    getArticlesOfFeed(result);
                });
            } else {
                $scope.selectFeed = null;
                getAllArticles();
            }
        }



        $scope.getNextPage = function () {
            console.log("GNP", lastOffset);
            lastOffset += pageSize;
            if ($scope.selectedFeed != null) {
                getArticlesOfFeed($scope.selectedFeed);
            } else {
                getAllArticles();
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
