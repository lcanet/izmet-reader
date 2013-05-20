var db = require('../db/db.js'),
    FeedParser  = require('feedparser'),
    request = require('request'),
    http = require('http'),
    fs = require('fs'),
    swagger = require('swagger-node-express');


var findById = {
    'spec': {
        "description" : "Find a feed",
        "path" : "/feed/{id}",
        "notes" : "Returns a feed based on ID",
        "summary" : "Find feed by ID",
        "method": "GET",
        "params" : [swagger.pathParam("id", "ID of the feed", "string")],
        "responseClass" : "Feed",
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "getFeedById"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);

        db.client.query(
            'SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed where id = $1',
            [id],
            function(err, result) {
            if (result.rows.length == 0) {
                swagger.errors.notFound('feed', res);
            } else {
                res.send(JSON.stringify(result.rows[0]));
            }
        });
    }
};


var getImage = {
    'spec': {
        "description" : "Get a feed image",
        "path" : "/feed/{id}/image",
        "notes" : "Returns the image (icon) of a feed",
        "summary" : "Get a feed icon",
        "method": "GET",
        "params" : [swagger.pathParam("id", "ID of the feed", "string")],
        "responseClass" : "void",
        "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('feed')],
        "nickname" : "getImage"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        db.client.query('select image from feed where id = $1', [id],
            function(err, result){
                if (err) {
                    console.log("Cannot get image", err);
                    res.send({code: 500, description: 'Cannot get image'});
                } else if (result.rows == null || result.rows.length == 0 || result.rows[0].image == null) {
                    swagger.errors.notFound('feed', res);
                } else {
                    var image = new Buffer(result.rows[0].image, 'base64');
                    res.setHeader("Content-Type: image/jpeg");
                    res.send(image);
                }
            });
    }
};
var findAll = {
    'spec': {
        "description" : "Find all feeds",
        "path" : "/feed",
        "notes" : "Returns all feeds",
        "summary" : "Find all feeds",
        "method": "GET",
        "responseClass" : "Array[Feed]",
        "nickname" : "findAllFeeds"
    },
    'action': function (req,res) {
        db.client.query('SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed', function(err, result) {
            res.send(JSON.stringify(result.rows));
        });
    }
};


var updateFeed = {
    'spec': {
        "description" : "Update a feed",
        "path" : "/feed/{id}",
        "notes" : "Updates a feed (only the poll_date is supported)",
        "summary" : "Updates a feed",
        "method": "PUT",
        "params" : [
            swagger.pathParam("id", "ID of the feed", "string"),
            {
                paramType: "body",
                required: "true",
                dataType: "Feed",
                description: "feed data"
            }
        ],
        "responseClass" : "Feed",
        "errorResponses" : [
            swagger.errors.invalid('id'),
            swagger.errors.notFound('feed')
        ],
        "nickname" : "updateFeed"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        var feedData = req.body;

        db.client.query("update feed set last_poll = $1 where id = $2", [ new Date(feedData.last_poll), id],
            function(err, result){
                if (err) {
                    res.send({"code": 500, "description": 'feed cannot be updated'}, 500);
                } else if (result.rowCount != 1) {
                    swagger.errors.notFound('feed', res);
                } else {
                    res.send("");
                }
            });

    }
};



var addFeed = {
    'spec': {
        "description" : "Add a new feed",
        "path" : "/feed",
        "notes" : "Creates a new feed",
        "summary" : "Creates a new feed",
        "method": "POST",
        "params" : [
            {
                paramType: "body",
                required: "true",
                dataType: "Feed",
                description: "feed data"
            }
        ],
        "responseClass" : "Feed",
        "nickname" : "addFeed"
    },
    'action': function (req,res) {
        var feed = req.body;
        db.client.query("insert into feed (type, name, url, description, poll_frequency) values ($1, $2, $3, $4, $5) RETURNING id",
            [feed.type, feed.name, feed.url, feed.description, feed.poll_frequency],
            function(err, result){
                var genId = result.rows[0].id;
                feed.id = genId;
                res.send(feed);

                // get feed image
                request(feed.url)
                    .pipe(new FeedParser({feedurl: feed.url}))
                    .on('error', function(err) {
                        console.log("Error polling feed " + feed.name, err);
                    })
                    .on('meta', function(meta){
                        if (meta.image && meta.image.url) {
                            addImageForFeed(feed, meta.image.url);
                        }
                    })
                ;
            });
    }
};

function addImageForFeed(feed, imageurl) {

    // poll rest pi
    request({url: imageurl, encoding: null}, function(err, response, body){
        if (!err && response.statusCode == 200) {

            db.client.query("update feed set image = $2 where id = $1",
                [feed.id, body.toString('base64')],
                function(err, result){
                    if (err) {
                        console.log("Cannot update feed image", err);
                    }
                });

        } else {
            console.log("Error while downloading feed image " , err);
        }
    });
}


var deleteFeed = {
    'spec': {
        "description" : "Delete a feed",
        "path" : "/feed/{id}",
        "notes" : "Deletes a feed and all of its articles",
        "summary" : "Deletes a feed",
        "method": "DELETE",
        "params" : [
            swagger.pathParam("id", "ID of the feed", "string")
        ],
        "responseClass" : "void",
        "nickname" : "deleteFeed"
    },
    'action': function (req,res) {
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        db.client.query("delete from article where feed_id = $1", [id],
            function(err, result){
                if (err) {
                    console.log("Cannot delete articles", err);
                    res.send({code: 500, description: "Cannot delete articles"});
                    return null;
                }
                db.client.query("delete from feed where id = $1", [id],
                    function(err, result){
                        if (err) {
                            console.log("Cannot delete feed", err);
                            res.send({code: 500, description: "Cannot delete feed"});
                            return null;
                        }
                        res.send("");
                    });
            });
    }
};


exports.getImage = getImage;
exports.findById = findById;
exports.findAll = findAll;
exports.updateFeed = updateFeed;
exports.addFeed = addFeed;
exports.deleteFeed = deleteFeed;