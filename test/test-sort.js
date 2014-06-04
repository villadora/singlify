var assert = require('assert');
var deps = require('../lib/deps');
var sort = require('../lib/sort');
var path = require('path');
var fs = require('fs');

describe('sort tree', function() {


    it('foreign deps', function(done) {
        deps(path.join(__dirname, './fixtures/couch-db/lib/index.js'), {
            keepForeign: true
        }, function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);

            assert.equal(sorted.length, 22);
            assert(/index\.js$/.test(sorted[0].id));
            assert(/^events$/.test(sorted[2].id));
            assert(/^request$/.test(sorted[21].id));
            done(err);
        });
    });


    it('sort couch-db', function(done) {
        deps(path.join(__dirname, './fixtures/couch-db/lib/index.js'), function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);

            assert.equal(sorted.length, 12);
            assert(/index\.js$/.test(sorted[0].id));
            assert(/couch\.js$/.test(sorted[1].id));
            assert(/base\.js$/.test(sorted[11].id));
            done(err);
        });
    });


    it('sort circular', function(done) {
        deps(path.join(__dirname, './fixtures/circular/index.js'), function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);
            assert.equal(sorted.length, 3);

            assert(/index\.js$/.test(sorted[0].id));
            assert(/a\.js$/.test(sorted[1].id));
            assert(/b\.js$/.test(sorted[2].id));
            done(err);
        });
    });


    it('sort one-dep', function(done) {
        deps(path.join(__dirname, './fixtures/one-dep/index.js'), function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);
            assert.equal(sorted.length, 2);

            assert(/index\.js$/.test(sorted[0].id));
            assert(/a\.js$/.test(sorted[1].id));
            done(err);
        });
    });



});