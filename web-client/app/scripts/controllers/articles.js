'use strict';

angular.module('izmet')
    .controller('ArticlesCtrl', function ($http, $scope, $routeParams) {

        function getArticlesOfFeed(feed){
            // TODO: use angular resource
            $http.get("/feed/" + feed.id + "/article")
                .success(function(result){
                    $scope.articles = result;
                });
        }

        // initialisation

        if ($routeParams.feedId) {
            // reset articles
            $scope.articles = [];

            $http.get("/feed/" + $routeParams.feedId).success(function(result){
                $scope.selectedFeed = result;
                getArticlesOfFeed(result);
            });
        }

        // styles

        $scope.getClassForArticle = function(article) {
            if (!article.read) {
                return 'unread';
            }
        }
    });
