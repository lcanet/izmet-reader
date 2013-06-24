var pg = require('pg'),
    promise = require("promises-a"),
    config = require('../config/config.js'),
    Sequelize = require('sequelize-postgres').sequelize,
    postgres = require('sequelize-postgres').postgres
    ;

/**
 * Get a connection from the pool . callback(client) will be called only if a connection suceeded
 * @param callback
 */
var getConnection = function(callback) {
    pg.connect(config.pgUrl, function(err, client, done) {
        try {
            if (err) {
                console.log("Error getting connection from pool", err);
                return;
            }
            callback(client);
        } finally {
            done();
        }
    });
};

var execSql = function(query, params) {
    var def = promise();
    // console.log("[SQL] '" + query + "' with params", params);
    getConnection(function(client){
        client.query(query, params, function(err,res){
            if (err) {
                console.log("SQL Error", err);
                def.reject(err);
            } else {
                def.fulfill(res);
            }
        });
    });
    return def.promise;
};


var sql = new Sequelize(config.database, config.dbUser, config.dbPass, {
    host: config.dbHost,
    port: config.dbPort,
    dialect: 'postgres',
    omitNull: true
});



var Feed = sql.define('feed', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: Sequelize.STRING,
    type: Sequelize.STRING,
    url: Sequelize.STRING,
    description: Sequelize.STRING,
    poll_frequency: Sequelize.INTEGER,
    last_poll: Sequelize.DATE,
    nb_unread: Sequelize.INTEGER,
    image_id: Sequelize.INTEGER,
    icon_id: Sequelize.INTEGER
}, {
    timestamps: false,
    freezeTableName: true,
    instanceMethods: {
        getLinks: function() {
            var links = [];
            if (this.image_id){
                links.push({type: 'image', href:'/image/' + this.image_id});
            }
            if (this.icon_id) {
                links.push({type: 'icon', href:'/image/' + this.icon_id });
            } else {
                if (this.type == 'rss') {
                    links.push({type: 'icon', href:'/image/default-icons/rss'});
                } else if (this.type == 'twitter') {
                    links.push({type: 'icon', href:'/image/default-icons/twitter'});
                }
            }
            return links;

        },

        output: function(){
            var vals = this.values;
            vals.links = this.getLinks();
            delete vals.image_id;
            delete vals.icon_id;

            return vals;
        }
    }
});

var Image = sql.define('image', {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    content_type: Sequelize.STRING,
    data: Sequelize.STRING,
    creation_date: Sequelize.DATE
}, {
    timestamps: false,
    freezeTableName: true
});


var Article = sql.define('article', {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    title: Sequelize.STRING,
    content: Sequelize.STRING,
    url: Sequelize.STRING,
    read: Sequelize.BOOLEAN,
    starred: Sequelize.BOOLEAN,
    fetch_date: Sequelize.DATE,
    article_date: Sequelize.DATE,
    article_id: Sequelize.STRING
}, {
    timestamps: false,
    freezeTableName: true
});

Article.belongsTo(Feed, { foreignKey: 'feed_id'});

var model = {
    Feed: Feed,
    Image: Image,
    Article: Article
};

exports.getConnection = getConnection;
exports.execSql = execSql;
exports.sql = sql;
exports.model = model;


