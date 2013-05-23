
/**
 * Used to place a set of properties of an object into a subobject
 * @param object
 * @param subObjectName
 * @param all others are property name
 */
var objectify = function(object, subObjectName) {
    var subObject = {};
    for (var i = 2; i < arguments.length; i++) {
        var propName = arguments[i];
        var val = object[propName];
        delete object[propName];
        subObject[propName] = val;
    }
    object[subObjectName] = subObject;
};

/**
 * Process an array of object
 * @param stack array of object
 * @param processor function(object, done)
 */
var processQueue = function(stack, processor, finalCallback) {
    var proceedNext = function(){
        if (stack != null && stack.length > 0) {
            var next = stack.shift();
            try {
                processor(next, proceedNext);
            } catch (e) {
                console.log("Caught exception in processor workqueue", e)
                proceedNext();
            }
        } else {
            if (finalCallback) {
                finalCallback();
            }
        }
    };
    proceedNext();
};

exports.objectify = objectify;
exports.processQueue = processQueue;