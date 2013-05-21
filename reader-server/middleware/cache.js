/**
 * Created with JetBrains WebStorm.
 * User: lc
 * Date: 21/05/13
 * Time: 21:54
 * To change this template use File | Settings | File Templates.
 */

exports.cache = function(req, res, next){
    if (!res.getHeader('Cache-Control')) {
        res.setHeader('Cache-Control', 'max-age=1');
    }
    next();
};