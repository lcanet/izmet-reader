
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

exports.objectify = objectify;