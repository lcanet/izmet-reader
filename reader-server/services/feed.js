var db = require('../db/db.js'),
    FeedParser = require('feedparser'),
    request = require('request'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    und = require('underscore'),
    poller = require('../poller/poller.js');


function getFeed(id, res) {

    db.getConnection(function (client) {
        client.query(
            'SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread,image is not null as imagePresent, icon is not null as iconPresent FROM feed where id = $1',
            [id],
            function (err, result) {
                if (!result.rows || result.rows.length == 0) {
                    res.send({code: 404, description: 'Not found'}, 404);
                } else {
                    processFeedLinks(result.rows);
                    res.send(result.rows[0]);
                }
            });
    });
}

var findById = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    getFeed(id, res);
};

var getImage = function (req, res) {
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.getConnection(function (client) {
        client.query('select image from feed where id = $1', [id],
            function (err, result) {
                if (err) {
                    console.log("Cannot get image", err);
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send({code:500, description:'Cannot get image'});
                } else if (result.rows == null || result.rows.length == 0 || result.rows[0].image == null) {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send({code: 404, description: 'Not found'}, 404);
                } else {
                    var image = new Buffer(result.rows[0].image, 'base64');
                    res.setHeader('Cache-Control', 'public,max-age=864000');
                    res.setHeader("Content-Type", "image/jpeg");
                    res.send(image);
                }
            });
    });
};



var getIcon = function (req, res) {
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.getConnection(function (client) {
        client.query('select icon from feed where id = $1', [id],
            function (err, result) {
                if (err) {
                    console.log("Cannot get icon", err);
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send({code:500, description:'Cannot get icon'}, 500);
                } else if (result.rows == null ||result.rows.length == 0 || result.rows[0].icon == null) {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.send({code:404, description:'Cannot get icon'}, 404);
                } else {
                    var image = new Buffer(result.rows[0].icon, 'base64');
                    res.setHeader("Content-Type", "image/jpeg");
                    res.setHeader('Cache-Control', 'public,max-age=864000');
                    res.send(image);
                }
            });
    });
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

function processFeedLinks(rows) {
    und.each(rows, function(f){
        var links = [];
        if (f.imagepresent) {
            links.push({type: 'image', href:'/feed/' + f.id + '/image'});
        }
        if (f.iconpresent) {
            links.push({type: 'icon', href:'/feed/' + f.id + '/icon'});
        } else {
            if (f.type == 'rss') {
                links.push({type: 'icon', href:'/feed/default-icons/rss'});
            } else if (f.type == 'twitter') {
                links.push({type: 'icon', href:'/feed/default-icons/twitter'});
            }
        }

        delete f.imagepresent;
        delete f.iconpresent;
        f.links = links;
    });

}

var findAll = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    db.getConnection(function (client) {
        client.query('SELECT id,type,name,url,description,poll_frequency,last_poll,nb_unread,image is not null as imagePresent, icon is not null as iconPresent ' +
            'FROM feed order by id', function (err, result) {
            processFeedLinks(result.rows);
            res.send(result.rows);
        });
    });
};

var updateFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    var feedData = req.body;

    db.execSql("update feed set last_poll = $1 where id = $2", [ new Date(feedData.last_poll), id])
        .then(function (result) {
            if (result.rowCount != 1) {
                res.send({code: 404, description: 'Not found'}, 404);
            } else {
                res.send({code:200, description:'Feed updated'}, 200);
            }
        }, function (err) {
            res.send({"code":500, "description":'feed cannot be updated'}, 500);
        });
};


var addFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var feed = req.body;

    // get feed data
    var feedOk = true;
    var feedImageUrl = null;

    if (feed.type == 'rss') {
        request(feed.url)
            .pipe(new FeedParser({feedurl:feed.url}))
            .on('error', function (err) {
                console.log("Error getting feed " + feed.url, err);
                feedOk = false;
                res.send({code:500, description:'Error getting feed'}, 500);
            })
            .on('meta', function (meta) {
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
            .on('end', function (err) {
                if (feedOk) {
                    db.execSql("insert into feed (type, name, url, description, poll_frequency) values ($1, $2, $3, $4, $5) RETURNING id",
                            [feed.type, feed.name, feed.url, feed.description, feed.poll_frequency])
                        .then(function(result){
                            feed.id = result.rows[0].id;

                            // add feed image
                            if (feedImageUrl != null) {
                                console.log("Downloading image for feed " + feed.name + " on " + feedImageUrl);
                                addImageForFeed(feed, feedImageUrl);
                            }

                            // also add favicon if there is any
                            addIconForFeed(feed);

                            // initial poll
                            poller.pollFeed(feed, function () {
                                res.location('/feed/' + feed.id);
                                res.send(201, { id : feed.id });
                            });

                        },
                        function(err){
                            res.send({code:500, description:'Error adding feed'}, 500);
                        });
                    }
            });
    } else if (feed.type == 'twitter') {
        if (!feed.name) {
            feed.name = feed.url;
        }
        feed.description = 'Twitter of ' + feed.name;
        var pr = db.execSql("insert into feed (type, name, url, description, poll_frequency) values ($1, $2, $3, $4, $5) RETURNING id",
            [feed.type, feed.name, feed.url, feed.description, feed.poll_frequency]);
        pr.then(function(result){
                feed.id = result.rows[0].id;
                poller.pollFeed(feed, function () {
                    res.location('/feed/' + feed.id);
                    res.send(201, { id : feed.id });
                });
            },
            function(error){
                console.log("Cannot insert feed", error);
                res.send({code:500, description:'Error adding feed'}, 500);
            });

    } else {
        res.send({code:402, description:'Unknown feed type'}, 402);
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

    request({url:url.format(opts), encoding:null}, function (err, response, body) {
        if (!err && response.statusCode == 200 && isImage(response)) {
            console.log("Updating image for feed " + feed.name);
            db.execSql("update feed set icon = $2 where id = $1",
                    [feed.id, body.toString('base64')])
                .then(function(success){
                },
                function(err){
                    console.log("Cannot update feed icon", err);

                });
        }
    });
}

function addImageForFeed(feed, imageurl) {

    // poll rest pi
    request({url:imageurl, encoding:null}, function (err, response, body) {
        if (!err && response.statusCode == 200 && isImage(response)) {
            console.log("Updating image for feed " + feed.name);
            db.execSql("update feed set image = $2 where id = $1",
                    [feed.id, body.toString('base64')])
                .then(function(success){
                }, function(err){
                    console.log("Cannot update feed image", err);
                });
            } else {
                console.log("Error while downloading feed image ", err);
            }
    });
}


var deleteFeed = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    db.getConnection(function (client) {
        client.query("delete from article where feed_id = $1", [id],
            function (err) {
                if (err) {
                    console.log("Cannot delete articles", err);
                    res.send({code:500, description:"Cannot delete articles"});
                } else {
                    db.getConnection(function (client) {
                        client.query("delete from feed where id = $1", [id],
                            function (err) {
                                if (err) {
                                    console.log("Cannot delete feed", err);
                                    res.send({code:500, description:"Cannot delete feed"});
                                } else {
                                    res.send("");
                                }
                            });
                    });
                }
            });
    });
};



var markAllAsRead = function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    if (!req.params.id) {
        res.send({code: 400, description: 'Invalid parameter id'}, 400);
        return;
    }
    var id = parseInt(req.params.id);
    var feedData = req.body;

    db.execSql("update article set read = true where feed_id = $1", [id])
        .then(function (result) {
            res.send({code:200, description:'Articles read'}, 200);
        }, function (err) {
            console.log("Cannot update articles", err);
            res.send({"code":500, "description":'Server error cannot be updated'}, 500);
        });
};


exports.getImage = getImage;
exports.getIcon = getIcon;
exports.findById = findById;
exports.findAll = findAll;
exports.updateFeed = updateFeed;
exports.addFeed = addFeed;
exports.deleteFeed = deleteFeed;
exports.getDefaultIcon = getDefaultIcon;
exports.markAllAsRead = markAllAsRead;