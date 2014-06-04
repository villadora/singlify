var util = require('util'),
    path = require('path'),
    async = require('async'),
    esprima = require('esprima'),
    estraverse = require('estraverse'),
    escope = require('escope'),
    fs = require('fs');


var finder = require('./stmtFinder');



module.exports = function(nodes, options, callback) {
    if (!nodes || !nodes.length) {
        return callback(null, []);
    }

    if (arguments.length == 2 && typeof options == 'function') {
        callback = options;
        options = {};
    }

    var tasks = [],
        ids = nodes.map(function(node) {
            return node.id;
        }),
        rootFile = ids[0];

    var foreignFn = options.foreignFn,
        exportAs = options.exportAs,
        changeAST = options.changeAST || true,
        nameTranslation = options.nameTranslation || (function() {
            var i = 0,
                maps = {};
            return function(id) {
                if (maps[id]) return maps[id];
                return maps[id] = ++i;
            };
        })(),
        template = options.template || function(content, id, node) {
            var name = nameTranslation(id);
            if (changeAST) {
                if (id == rootFile && exportAs)
                    return util.format('(function(exports) {\n%s\n })(%s);', content, exportAs);

                return util.format('(function(exports) {\n%s\n })(modules[%s].exports);', content, name);
            } else {
                return util.format('(function(require, module, exports) {\n%s\n})(reqFn, modules[%s], module[%s].exports);',
                    content, name, name);
            }
        },
        encoding = options.encoding || 'utf8';

    nodes = nodes || [];

    // module id to ast
    var mMgr = require('./moduleMgr')();

    for (var i = 0, len = nodes.length; i < len; ++i) {
        (function(node, isRoot) {
            tasks.push(function(cb) {
                var rootBase = node.id;
                if (node.isForeign) {
                    if (!foreignFn)
                        cb(new Error('No foreignFn provided but there is a foriegn module:' + node.id));

                    foreignFn(node, function(err, /* transformed ast */ tAST) {
                        mAst[node.id] = tAST;
                        cb(err, tAST);
                    });
                } else {
                    // read file content
                    fs.readFile(node.id, {
                        encoding: encoding
                    }, function(err, content) {
                        if (err) return cb(err);
                        var ast = esprima.parse(template(content, node.id, node), {
                            // loc: true,
                            range: true,
                            tolerant: true
                        });

                        mMgr.addBlock(node.id, ast);

                        // do transform
                        // 1. find all require place statement
                        // 2. find module.exports statement
                        // 3. find all exports statement

                        var scopeManager = escope.analyze(ast);

                        var requires = finder.findRequire(ast, scopeManager.scopes);
                        requires.forEach(function(expr) {
                            var p = expr.arguments[0].value;
                            if (/^\.\.?\//.test(p)) { // not foreign package
                                var requireId = path.join(path.dirname(rootBase), p);
                                !/\.js$/.test(requireId) && (requireId += '.js');
                                mMgr.addUse(requireId, expr);
                            }
                        });


                        finder.findModule(ast, scopeManager.scopes).forEach(function(expr) {
                            mMgr.addDef(node.id, expr);
                        });

                        finder.findExports(ast, scopeManager.scopes).forEach(function(expr) {
                            mMgr.addExports(node.id, expr);
                        });


                        cb(err, ast);
                    });
                }
            });
        })(nodes[i], i === 0);
    }

    async.parallel(tasks, function(err, asts) {
        // now we get all asts

        mMgr.transform(ids, function(id) {
            if (id == rootFile && exportAs) {
                return {
                    type: 'Identifier',
                    name: exportAs
                };
            }

            var name = nameTranslation(id);

            return {
                type: "MemberExpression",
                computed: true,
                object: {
                    type: "Identifier",
                    name: "modules"
                },
                property: {
                    type: "Literal",
                    value: name,
                    raw: "\"" + name + "\""
                }
            };
        }, changeAST ? undefined : function() {}); /* don't transform code now */


        var asts = ids.reverse().map(function(id, i) {
            return mMgr.getBlock(id);
        });


        var prefix = ["var modules = {};"];

        if (changeAST) {
            prefix.push("");
        }

        ids.forEach(function(id) {
            var name = nameTranslation(id);
            if (changeAST)
                prefix.push(util.format("modules['%s'] = {};", name));
            else {
                prefix.push(util.format("modules['%s'] = {exports:{}};", name));
            }
        });

        asts.unshift(esprima.parse(prefix.join("\n")));

        callback(err, asts);
    });
};