var server = require('../server'),
    request = require('supertest'),
    assert = require('assert'),
    should = require('should');

describe('Rest API Test', function(){

    it('Should have feeds', function(done){
        request('http://localhost:8080')
            .get('/feed')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(function(err,res){
                assert.equal(err, null);
                var feeds = res.body;
                feeds.length.should.be.greaterThan(1);
                feeds.length.should.be.lessThan(1000);

                var feed = feeds[0];
                feed.should.have.property('id');
                feed.should.have.property('name');
                feed.should.have.property('description');
                feed.should.have.property('type');

                done();
            });
    });


    it('Should have 1 feed', function(done){
        request('http://localhost:8080')
            .get('/feed/1134')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(function(err,res){
                var feed = res.body;
                feed.should.have.property('id', 1134);
                feed.should.have.property('name');
                feed.should.have.property('description');
                feed.should.have.property('type');

                done();
            });
    });


    it('Should have 1 icon ', function(done){
        request('http://localhost:8080')
            .get('/feed/1134/icon')
            .expect(200)
            .expect('Content-Type', 'image/png')
            .end(function(err,res){
                done();
            });
    });


    it('Should not have an unknown feed', function(done){
        request('http://localhost:8080')
            .get('/feed/11343010')
            .expect(404)
            .end(function(err,res){
                done();
            });
    });

});