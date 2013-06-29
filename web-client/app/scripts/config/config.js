/**
 * Created with JetBrains WebStorm.
 * User: lc
 * Date: 26/06/13
 * Time: 20:06
 * To change this template use File | Settings | File Templates.
 */
'use strict';

function IzmetParametersProvider() {

    this.defaults = {
        mobile: false,
        backendUrl: '/'
    };

    this.$get = function(){
        var obj = angular.copy(this.defaults, {});
        return obj;
    };
}
angular.module('izmetConfig', []).provider('izmetParameters',IzmetParametersProvider);