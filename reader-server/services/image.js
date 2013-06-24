var db = require('../db/db.js'),
    utils = require('../utils/utils.js'),
    und = require('underscore'),
    fs = require('fs'),
    promise = require("promises-a");

function getErrorHandler(res){
    return function(err){
        console.log('DB Error', err);
        if (res) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.send(500, {code: 500, description: 'Database error'});
        }
    }
}

var findById = function (req, res) {

    var id = req.params.imageId;
    if (!id) {
        res.header("Content-Type", "application/json; charset=utf-8");
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
    } else {
        db.model.Image.find(id)
            .success(function(image){
                if (image){
                    var content = new Buffer(image.data, 'base64');
                    res.setHeader("Content-Type", image.content_type);
                    res.setHeader('Cache-Control', 'public,max-age=864000');
                    res.send(content);
                } else {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send(404, {code: 404, description: 'Image not found'});
                }
            })
            .error(getErrorHandler(res));
    }
};




var getDefaultIcon = function (req, res) {
    var type = req.params.type;

    // send default icon
    fs.readFile('resources/' + type + '.png', function (err, data) {
        if (err) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.send({code:404, description:'Cannot get icon'}, 404);
        } else {
            res.setHeader("Content-Type", "image/png");
            res.setHeader('Cache-Control', 'public,max-age=864000');
            res.send(data);
        }
    });
};


exports.findById = findById;
exports.getDefaultIcon = getDefaultIcon;