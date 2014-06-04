var assert = require('assert');
var deps = require('../lib/deps');
var path = require('path');

describe('dependencies analysis', function() {

    function noForeignCircle(node) {
        assert(!node.isForeign); // failed when isForeign
        node.dependencies && node.dependencies.forEach(noForeignCircle); // Maximum call stack when there is circle
    }


    function noCircle(node) {
        node.dependencies && node.dependencies.forEach(noCircle); // Maximum call stack when there is circle
    }



    it('for circular', function(done) {
        deps(path.join(__dirname, './fixtures/circular/index.js'), function(err, tree) {
            if (err) return done(err);
            noForeignCircle(tree);
            var a = tree.dependencies[0];
            assert(a);
            var b = a.dependencies[0];
            assert(b);
            assert(/b\.js$/.test(b.id));
            assert.equal(b.dependencies.length, 0);
            assert.equal(tree.dependencies.length, 1);
            done(err);
        });
    });


    it('keepForeign', function(done) {
        deps(path.join(__dirname, './fixtures/couch-db/lib/index.js'), {
            keepForeign: true
        }, function(err, tree) {
            if (err) return done(err);
            assert.equal(tree.dependencies.length, 7);
            assert.equal(tree.dependencies[0].dependencies.length, 10);
            noCircle(tree);
            done(err);
        });
    });

    it('for couch-db', function(done) {
        deps(path.join(__dirname, './fixtures/couch-db/lib/index.js'), function(err, tree) {
            if (err) return done(err);
            noForeignCircle(tree);
            assert.equal(tree.dependencies.length, 7);
            assert.equal(tree.dependencies[0].dependencies.length, 3);
            done(err);
        });
    });


    it('for commonjs-walker', function(done) {
        deps(path.join(__dirname, './fixtures/commonjs-walker/index.js'), function(err, tree) {
            if (err) return done(err);
            noForeignCircle(tree);
            assert.equal(tree.dependencies.length, 2);
            done(err);
        });
    });

});