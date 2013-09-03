'use strict';

/**
 * @ngdoc object
 * @name ngMobile.$swipe
 *
 * @description
 * The `$swipe` service is a service that abstracts the messier details of hold-and-drag swipe
 * behavior, to make implementing swipe-related directives more convenient.
 *
 * It is used by the `ngSwipeLeft` and `ngSwipeRight` directives in `ngMobile`, and by
 * `ngCarousel` in a separate component.
 *
 * # Usage
 * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
 * which is to be watched for swipes, and an object with four handler functions. See the
 * documentation for `bind` below.
 */
var ngMobile = angular.module('ngMobile', []);

ngMobile.factory('$swipe', [function() {
    // The total distance in any direction before we make the call on swipe vs. scroll.
    var MOVE_BUFFER_RADIUS = 10;

    function getCoordinates(event) {
        var touches = event.touches && event.touches.length ? event.touches : [event];
        var e = (event.changedTouches && event.changedTouches[0]) ||
            (event.originalEvent && event.originalEvent.changedTouches &&
                event.originalEvent.changedTouches[0]) ||
            touches[0].originalEvent || touches[0];

        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    return {
        /**
         * @ngdoc method
         * @name ngMobile.$swipe#bind
         * @methodOf ngMobile.$swipe
         *
         * @description
         * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
         * object containing event handlers.
         *
         * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
         * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }`.
         *
         * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
         * watching for `touchmove` or `mousemove` events. These events are ignored until the total
         * distance moved in either dimension exceeds a small threshold.
         *
         * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
         * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
         * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
         *   A `cancel` event is sent.
         *
         * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
         * a swipe is in progress.
         *
         * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
         *
         * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
         * as described above.
         *
         */
        bind: function(element, eventHandlers) {
            // Absolute total movement, used to control swipe vs. scroll.
            var totalX, totalY;
            // Coordinates of the start position.
            var startCoords;
            // Last event's position.
            var lastPos;
            // Whether a swipe is active.
            var active = false;

            element.on('touchstart mousedown', function(event) {
                startCoords = getCoordinates(event);
                active = true;
                totalX = 0;
                totalY = 0;
                lastPos = startCoords;
                eventHandlers['start'] && eventHandlers['start'](startCoords);
            });

            element.on('touchcancel', function(event) {
                active = false;
                eventHandlers['cancel'] && eventHandlers['cancel']();
            });

            element.on('touchmove mousemove', function(event) {
                if (!active) return;

                // Android will send a touchcancel if it thinks we're starting to scroll.
                // So when the total distance (+ or - or both) exceeds 10px in either direction,
                // we either:
                // - On totalX > totalY, we send preventDefault() and treat this as a swipe.
                // - On totalY > totalX, we let the browser handle it as a scroll.

                if (!startCoords) return;
                var coords = getCoordinates(event);

                totalX += Math.abs(coords.x - lastPos.x);
                totalY += Math.abs(coords.y - lastPos.y);

                lastPos = coords;

                if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
                    return;
                }

                // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
                if (totalY > totalX) {
                    // Allow native scrolling to take over.
                    active = false;
                    eventHandlers['cancel'] && eventHandlers['cancel']();
                    return;
                } else {
                    // Prevent the browser from scrolling.
                    event.preventDefault();

                    eventHandlers['move'] && eventHandlers['move'](coords);
                }
            });

            element.on('touchend mouseup', function(event) {
                if (!active) return;
                active = false;
                eventHandlers['end'] && eventHandlers['end'](getCoordinates(event));
            });
        }
    };
}]);

/**
 * @ngdoc directive
 * @name ngMobile.directive:ngSwipeLeft
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag too.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
 <doc:example>
 <doc:source>
 <div ng-show="!showActions" ng-swipe-left="showActions = true">
 Some list content, like an email in the inbox
 </div>
 <div ng-show="showActions" ng-swipe-right="showActions = false">
 <button ng-click="reply()">Reply</button>
 <button ng-click="delete()">Delete</button>
 </div>
 </doc:source>
 </doc:example>
 */

/**
 * @ngdoc directive
 * @name ngMobile.directive:ngSwipeRight
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag too.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
 <doc:example>
 <doc:source>
 <div ng-show="!showActions" ng-swipdfsdfdse-left="showActions = true">
 Some list content, like an email in the inbox
 </div>
 <div ng-show="showActions" ng-swipe-right="showActions = false">
 <button ng-click="reply()">Reply</button>
 <button ng-click="delete()">Delete</button>
 </div>
 </doc:source>
 </doc:example>
 */

function makeSwipeDirective(directiveName, direction) {
    ngMobile.directive(directiveName, ['$parse', '$swipe', function($parse, $swipe) {

        // The maximum vertical delta for a swipe should be less than 75px.
        var MAX_VERTICAL_DISTANCE = 75;
        // Vertical distance should not be more than a fraction of the horizontal distance.
        var MAX_VERTICAL_RATIO = 0.3;
        // At least a 30px lateral motion is necessary for a swipe.
        var MIN_HORIZONTAL_DISTANCE = 30;

        return function(scope, element, attr) {
            var swipeHandler = $parse(attr[directiveName]);

            var startCoords, valid;

            function validSwipe(coords) {
                // Check that it's within the coordinates.
                // Absolute vertical distance must be within tolerances.
                // Horizontal distance, we take the current X - the starting X.
                // This is negative for leftward swipes and positive for rightward swipes.
                // After multiplying by the direction (-1 for left, +1 for right), legal swipes
                // (ie. same direction as the directive wants) will have a positive delta and
                // illegal ones a negative delta.
                // Therefore this delta must be positive, and larger than the minimum.
                if (!startCoords) return false;
                var deltaY = Math.abs(coords.y - startCoords.y);
                var deltaX = (coords.x - startCoords.x) * direction;
                return valid && // Short circuit for already-invalidated swipes.
                    deltaY < MAX_VERTICAL_DISTANCE &&
                    deltaX > 0 &&
                    deltaX > MIN_HORIZONTAL_DISTANCE &&
                    deltaY / deltaX < MAX_VERTICAL_RATIO;
            }

            $swipe.bind(element, {
                'start': function(coords) {
                    startCoords = coords;
                    valid = true;
                },
                'cancel': function() {
                    valid = false;
                },
                'end': function(coords) {
                    if (validSwipe(coords)) {
                        scope.$apply(function() {
                            swipeHandler(scope);
                        });
                    }
                }
            });
        };
    }]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1);
makeSwipeDirective('ngSwipeRight', 1);

