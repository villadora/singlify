var path = require('path');
var util = require('util');
var escodegen = require('escodegen');

module.exports = function(options, callback) {
    var root = options.root;
    if (!root) {
        return callback(new Error("Root file must be provided"));
    }

    var root = path.resolve(process.cwd(), root);

    var exportAs = options.exportAs || 'main';

    var nameTranslation = options.translation;

    var foreignFn = options.foreignFn;

    // find deps
    require('./deps')(root, {
        keepForeign: !! foreignFn
    }, function(err, depTree) {
        if (err) return callback(err);

        // topsort the dependencies
        require('./transform')(require('./sort')(depTree), {
            exportAs: exportAs,
            foreignFn: foreignFn,
            nameTranslation: nameTranslation
        }, function(err, asts) {
            // generate codes
            var codes = (asts || []).map(escodegen.generate);

            if (codes.length) {
                if (exportAs) {
                    codes.unshift(util.format("var %s = {};", exportAs));
                    codes.push(util.format("module.exports = %s;", exportAs));
                }
            }

            //  concat all the ouput together by order and add exports
            callback(err, codes.join('\n'));
        });


    });
};