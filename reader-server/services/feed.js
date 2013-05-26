var db = require('../db/db.js'),
    FeedParser  = require('feedparser'),
    request = require('request'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    poller = require('../poller/poller.js'),
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
        res.header("Content-Type", "application/json; charset=utf-8");
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);

        db.getConnection(function(client) {
            client.query(
                'SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed where id = $1',
                [id],
                function(err, result) {
                    if (result.rows.length == 0) {
                        swagger.errors.notFound('feed', res);
                    } else {
                        res.send(JSON.stringify(result.rows[0]));
                    }
                });
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
        db.getConnection(function(client) {
            client.query('select image from feed where id = $1', [id],
            function(err, result){
                if (err) {
                    console.log("Cannot get image", err);
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send({code: 500, description: 'Cannot get image'});
                } else if (result.rows == null || result.rows.length == 0 || result.rows[0].image == null) {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    swagger.errors.notFound('feed', res);
                } else {
                    var image = new Buffer(result.rows[0].image, 'base64');
                    res.setHeader("Content-Type", "image/jpeg");
                    res.send(image);
                }
            });
        });
    }
};


var getIcon = {
    'spec': {
        "description" : "Get a feed icon",
        "path" : "/feed/{id}/icon",
        "notes" : "Returns the icon of a feed",
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
        db.getConnection(function(client) {
            client.query('select icon from feed where id = $1', [id],
                function(err, result){
                    if (err) {
                        console.log("Cannot get icon", err);
                        res.header("Content-Type", "application/json; charset=utf-8");
                        res.send({code: 500, description: 'Cannot get icon'}, 500);
                    } else if (result.rows == null || result.rows.length == 0 || result.rows[0].icon == null) {
                        // send default icon
                        fs.readFile('resources/rss.png', function(err, data){
                            if (err) {
                                res.header("Content-Type", "application/json; charset=utf-8");
                                res.send({code: 500, description: 'Cannot get icon'}, 500);
                            } else {
                                res.setHeader("Content-Type", "image/png");
                                res.send(data);
                            }
                        });
                    } else {
                        var image = new Buffer(result.rows[0].icon, 'base64');
                        res.setHeader("Content-Type", "image/jpeg");
                        res.send(image);
                    }
                });
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
        res.header("Content-Type", "application/json; charset=utf-8");
        db.getConnection(function(client) {
            client.query('SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread FROM feed order by id', function(err, result) {
                res.send(JSON.stringify(result.rows));
            });
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
        res.header("Content-Type", "application/json; charset=utf-8");
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        var feedData = req.body;

        db.execSql("update feed set last_poll = $1 where id = $2", [ new Date(feedData.last_poll), id])
            .then(function(result){
                if (result.rowCount != 1) {
                    swagger.errors.notFound('feed', res);
                } else {
                    res.send({code: 200, description: 'Feed updated'}, 200);
                }
            }, function(err){
                res.send({"code": 500, "description": 'feed cannot be updated'}, 500);
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
        res.header("Content-Type", "application/json; charset=utf-8");
        var feed = req.body;

        // get feed data
        var feedOk = true;
        var feedImageUrl = null;

        request(feed.url)
            .pipe(new FeedParser({feedurl: feed.url}))
            .on('error', function(err) {
                console.log("Error getting feed " + feed.url, err);
                feedOk = false;
                res.send({code: 500, description: 'Error getting feed'}, 500);
            })
            .on('meta', function(meta){
                if (meta.image && meta.image.url) {
                    feedImageUrl = meta.image.url;

                }

                // use provided feed description
                if (!feed.name && meta.title) {
                    feed.name = meta.title;
                }
                if (!feed.description && meta.description) {
                    feed.description = meta.description;
                }
            })
            .on('end', function(err){
                if (feedOk) {
                    db.getConnection(function(client) {
                        client.query("insert into feed (type, name, url, description, poll_frequency) values ($1, $2, $3, $4, $5) RETURNING id",
                            [feed.type, feed.name, feed.url, feed.description, feed.poll_frequency],
                            function(err, result){
                                if (err) {
                                    res.send({code: 500, description: 'Error adding feed'}, 500);
                                    return;
                                }
                                feed.id = result.rows[0].id;

                                // add feed image
                                if (feedImageUrl != null){
                                    console.log("Downloading image for feed " + feed.name +  " on " + feedImageUrl);
                                    addImageForFeed(feed, feedImageUrl);
                                }

                                // also add favicon if there is any
                                addIconForFeed(feed);

                                // initial poll
                                poller.pollFeed(feed, function(){
                                    res.send(feed);
                                });

                            });
                    });
                }
            })
        ;

    }
};

function isImage(response) {
    var content = response.headers['content-type'];
    return content && content.toLowerCase().indexOf('image/') == 0;
}

function addIconForFeed(feed) {
    var opts = url.parse(feed.url);
    // erase path
    opts.path = opts.pathname = '/favicon.ico';

    request({url: url.format(opts), encoding: null}, function(err, response, body){
        if (!err && response.statusCode == 200 && isImage(response)) {
            console.log("Updating image for feed " + feed.name);
            db.getConnection(function(client) {
                client.query("update feed set icon = $2 where id = $1",
                    [feed.id, body.toString('base64')],
                    function(err, result){
                        if (err) {
                            console.log("Cannot update feed icon", err);
                        }
                    });
            });
        }
    });

}

function addImageForFeed(feed, imageurl) {

    // poll rest pi
    request({url: imageurl, encoding: null}, function(err, response, body){
        if (!err && response.statusCode == 200 && isImage(response)) {
            console.log("Updating image for feed " + feed.name);
            db.getConnection(function(client) {
                client.query("update feed set image = $2 where id = $1",
                    [feed.id, body.toString('base64')],
                    function(err, result){
                        if (err) {
                            console.log("Cannot update feed image", err);
                        }
                    });
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
        res.header("Content-Type", "application/json; charset=utf-8");
        if (!req.params.id) {
            throw swagger.errors.invalid('id');
        }
        var id = parseInt(req.params.id);
        db.getConnection(function(client) {
            client.query("delete from article where feed_id = $1", [id],
                function(err){
                    if (err) {
                        console.log("Cannot delete articles", err);
                        res.send({code: 500, description: "Cannot delete articles"});
                    } else {
                        db.getConnection(function(client) {
                            client.query("delete from feed where id = $1", [id],
                                function(err){
                                    if (err) {
                                        console.log("Cannot delete feed", err);
                                        res.send({code: 500, description: "Cannot delete feed"});
                                    } else {
                                        res.send("");
                                    }
                                });
                        });
                    }
                });
        });
    }
};


exports.getImage = getImage;
exports.getIcon = getIcon;
exports.findById = findById;
exports.findAll = findAll;
exports.updateFeed = updateFeed;
exports.addFeed = addFeed;
exports.deleteFeed = deleteFeed;