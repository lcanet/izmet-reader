'use strict';
/* global $ */

angular.module('izmet')
    .directive('detailbox', function(){
        return {
            restrict: 'E',
            template: '<div></div>',
            replace: true,
            transclude: false,
            link: function(scope,elt,attrs) {
                var detailBoxElt = $('#' + attrs.detailboxContent);
                scope.$watch(attrs.detailboxShow, function(nv){
                    if (nv) {
                        detailBoxElt.show();
                        detailBoxElt.appendTo(elt);
                        elt.show();
                    } else {
                        elt.hide();
                    }

                });
            }
        };
    })

;
