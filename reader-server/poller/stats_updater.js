var db = require('../db/db.js'),
    und = require('underscore'),
    utils = require('../utils/utils.js'),
    moment = require('moment'),
    cronJob = require('cron').CronJob,
    timer = require('../utils/timer.js'),
    Sequelize = require('sequelize');

function errorHandler(err) {
    console.log(err);
};

/**
 * Update stats
 */
var updateStats = function(){
    console.log('Updating feed stats');
    var sw = timer();
    sw.start();

    // first delete all
    db.sql.query('delete from feed_stat')
        .success(function(){
            // refresh all stats
            getStats(function(resultsById){
                saveResults(resultsById, function(){
                    sw.stop();
                    console.log("Feed stats refresh done in " + sw.getTime() + " ms");
                });
            });
        })
        .error(errorHandler);
};

function getStats(callback) {
    // table indexed by id
    var resultsById = {};

    // do some sort of pagine
    getStatsPage(callback, resultsById, 0);
}

function getStatsPage(callback, resultsById, start){
    var thresholds = [
        { property: 'articles_day', threshold: moment().subtract('day', 1) },
        { property: 'articles_week', threshold: moment().subtract('day', 7) },
        { property: 'articles_month', threshold: moment().subtract('month', 1) },
        { property: 'articles_quarter', threshold: moment().subtract('month', 3) },
        { property: 'articles_year', threshold: moment().subtract('year', 1) }
    ];

    db.model.Article.findAll({where: '1=1', order: 'id', limit: 100, offset: start, raw:true})
        .success(function(res){
            console.log('Processing result for page ' + start);
            // process each article
            for (var i  = 0; i < res.length; i++) {
                processArticle(thresholds, resultsById, res[i]);
            }

            // go to next page
            if (res.length > 0){
                getStatsPage(callback, resultsById, start + 100);
            } else{
                callback(resultsById);
            }
        })
        .error(errorHandler);
}

function saveResults(resultsById, callback){
    console.log('Saving results');

    // replace moment objects
    var vals = und.values(resultsById);
    und.each(vals,function(item){
        if (item.first_fetch) {
            item.first_fetch = item.first_fetch.format();
        }
        if (item.last_fetch) {
            item.last_fetch = item.last_fetch.format();
        }
    });
    db.model.FeedStat.bulkCreate(vals)
        .success(function(res){
            console.log('Stats insert ok');
            callback();
        })
        .error(errorHandler);
}

function processArticle(standardThresholds, resultsById, article) {
    // get related feed stats
    var feedStat = resultsById[article.feed_id];
    if (!feedStat) {
        feedStat = {
            nb_articles: 0,
            feed_id: article.feed_id
        };
        // zero of standard thresholds
        for (var i = 0; i < standardThresholds.length; i++){
            feedStat[standardThresholds[i].property] = 0;
        }
        resultsById[article.feed_id] = feedStat;
    }

    var ad = moment(article.article_date);
    var afd = moment(article.fetch_date);
    if (ad != null && afd != null) {
        // simple
        feedStat.nb_articles++;
        // first/last
        feedStat.first_fetch = (feedStat.first_fetch == null || feedStat.first_fetch.isAfter(afd)) ? afd : feedStat.first_fetch;
        feedStat.last_fetch = (feedStat.last_fetch == null || feedStat.last_fetch.isBefore(afd)) ? afd : feedStat.last_fetch;

        // last_day/year/month etc
        for (var i = 0; i < standardThresholds.length; i++) {
            if (ad.isAfter(standardThresholds[i].threshold)){
                feedStat[standardThresholds[i].property]++;
            }
        }
    }
}

var startUpdater = function(devMode) {
    new cronJob('00 0 * * * *', updateStats).start();
};

exports.startUpdater = startUpdater;
exports.updateStats = updateStats;
