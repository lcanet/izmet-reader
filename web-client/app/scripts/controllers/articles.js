'use strict';

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams) {

        function getArticlesOfFeed(feed){
            $http.get("/feed/" + feed.id + "/article")
                .success(function(result){
                    $scope.articles = result;
                });
        }

        // initialisation

        if ($routeParams.feedId) {
            // reset articles
            $scope.articles = [];
            $scope.currentArticle = null;

            $http.get("/feed/" + $routeParams.feedId).success(function(result){
                $scope.selectedFeed = result;
                getArticlesOfFeed(result);
            });
        }

        // styles

        $scope.getClassForArticleHeader = function(article) {
            if (!article.read) {
                return 'unread';
            } else {
                return 'read';
            }
        };
        $scope.selectArticle = function(article) {
            $scope.currentArticle = article;
            article.read = true;
            // TODO: persist read state
        };

    });
