'use strict';
/* global Rainbow */

angular.module('izmet').directive('articleHistogram', function(){
    return {
        restrict: 'E',
        replace: true,
        scope: {
            model: '=',
            globalMax: '='
        },
        template: '<canvas></canvas>',
        link: function(scope,elt,attrs) {
            elt.attr('width', attrs.width);
            elt.attr('height', attrs.height);

            var ctx = elt[0].getContext('2d');

            var w = attrs.width;
            var h = attrs.height;

            // calculate gradient
            var gradient;

            var data = null;
            var globalMax = null;

            function redraw() {
                if (!data) {
                    return;
                }
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);

                var step = (w-1) / data.length;

                var i = 0;
                var m = 0;
                for (i = 0; i < data.length; i++){
                    m = Math.max(m, data[i]);
                }
                ctx.fillStyle = '#000000';
                for (i = 0; i < data.length; i++){
                    // start with the leftmost item but the last value in dataset
                    var relVal = m === 0 ? 0 : (data[data.length - 1 - i] / m) * h;
                    if (gradient !== null) {
                        ctx.fillStyle = gradient.colorAt(data[i]);
                    } else {
                        ctx.fillStyle = '#000000';
                    }
                    ctx.fillRect(1 + i*step, h - relVal, step - 1, relVal);
                }

                // print labels (0, -max, middle)
                ctx.fillStyle = '#000000';
                ctx.font = '9px bold sans';
                ctx.textBaseline = 'top';

                ctx.align = 'left';
                ctx.fillText('-' + (data.length) + ' days', 0, 0);

                ctx.align = 'middle';
                ctx.fillText('-' + (data.length / 2), w/2, 0);

                ctx.align = 'right';
                ctx.fillText('today', w-26, 0);

            }
            scope.$watch('model', function(newVal){
                data = newVal;
                redraw();
            });
            scope.$watch('globalMax', function(newVal){
                globalMax = newVal;

                // recalculate gradient
                if (newVal) {
                    gradient = new Rainbow();
                    gradient.setNumberRange(0, newVal);
                    gradient.setSpectrum('yellow', 'red');
                } else {
                    gradient = null;
                }

                redraw();


            });
        }

    };
});
