var assert = require('assert');
var path = require('path');
var esprima = require('esprima');
var escodegen = require('escodegen');
var escope = require('escope');
var fs = require('fs');

var deps = require('../lib/deps'),
    sort = require('../lib/sort'),
    transform = require('../lib/transform');

describe('transform tree', function() {

    it('transform couch-db', function(done) {
        deps(path.join(__dirname, './fixtures/couch-db/lib/index.js'), function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);
            assert.equal(sorted.length, 12);
            transform(sorted, {
                exportAs: 'couch'
            }, function(err, asts) {
                if (err) return done(err);

                var codes = asts.map(escodegen.generate); // non-breaking syntax
                codes.unshift("var modules = {}, couch = {};");
                codes.push("module.exports = couch");
                var content = codes.join("\n");
                done(err);
            });
        });
    });

    it('transform circular', function(done) {
        deps(path.join(__dirname, './fixtures/circular/index.js'), function(err, tree) {
            if (err) return done(err);
            transform(sort(tree), function(err, asts) {
                if (err) return done(err);
                var codes = asts.map(escodegen.generate);
                eval(codes.join('\n')); // evaluable
                done(err);
            });
        });
    });


    it('transform one-dep', function(done) {
        deps(path.join(__dirname, './fixtures/one-dep/index.js'), function(err, tree) {
            if (err) return done(err);
            var sorted = sort(tree);
            assert.equal(sorted.length, 2);
            transform(sorted, {
                exportAs: 'Index'
            }, function(err, asts) {
                asts.map(escodegen.generate); // non-breaking syntax
                done(err);
            });
        });
    });
});

describe('stmtFinder', function() {
    var finder = require('../lib/transform/stmtFinder'),
        ast, scopes;
    before(function() {
        ast = esprima.parse(fs.readFileSync(path.join(__dirname, './fixtures/one-dep/index.js')));
        scopes = escope.analyze(ast).scopes;
    });

    it('findRequire', function() {
        var requires = finder.findRequire(ast, scopes);
        assert.equal(requires.length, 1);
    });

    it('findModule', function() {
        var modules = finder.findModule(ast, scopes);
        assert.equal(modules.length, 1);
    });

    it('findExports', function() {
        var exps = finder.findExports(ast, scopes);
        assert.equal(exps.length, 2);
    });

});