'use strict';

angular.module('izmet')
    .directive('izModal', function(){
        return {
            restrict: 'A',
            replace: false,
            link: function(scope,elt,attrs) {
                scope.$watch(attrs.izModal, function(newVal){
                    elt.modal(newVal ? 'show' : 'hide');
                });
            }
        };
    })

;
