var config = require('../config/config.js'),
    Sequelize = require('sequelize-postgres').sequelize,
    postgres = require('sequelize-postgres').postgres
    ;

var sql = new Sequelize(config.db.database, config.db.user, config.db.pass, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    omitNull: true,
    logging: false
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
                links.push({type: 'image', href:'/resource/' + this.image_id});
            }
            if (this.icon_id) {
                links.push({type: 'icon', href:'/resource/' + this.icon_id });
            } else {
                if (this.type == 'rss') {
                    links.push({type: 'icon', href:'/resource/default-icons/rss'});
                } else if (this.type == 'twitter') {
                    links.push({type: 'icon', href:'/resource/default-icons/twitter'});
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

exports.sql = sql;
exports.model = model;


