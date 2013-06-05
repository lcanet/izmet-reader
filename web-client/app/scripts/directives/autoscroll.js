'use strict';

angular.module('izmet')
    .directive('autoscroll', function() {
        return {
            restrict: 'A',
            replace: false,
            transclude: false,
            link: function(scope,elt,attrs) {

                var idToWatch;
                var derefn = null;
                // liste for 'autoscroll'
                derefn = scope.$on('autoscroll', function(evt,param){
                    if (param === idToWatch){
                        // need to do it later so that the view size can be fully calculated
                        setTimeout(function(){
                            elt[0].scrollIntoView();
                        }, 10);
                    }
                });

                // get value of id property
                scope.$watch(attrs.autoscroll, function(chg){
                    idToWatch = chg;
                });
                // unregister event once we are deleted from the dom
                scope.$on('$destroy', function(){
                    if (derefn){
                        derefn();
                    }
                });
            }
        };
    })

;
