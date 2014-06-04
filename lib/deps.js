var walker = require('commonjs-walker');


module.exports = function(root, options, callback) {
    if (arguments.length == 2 && typeof options == 'function') {
        callback = options;
        options = {};
    }

    var keepForeign = options.keepForeign;

    walker(root, {
        detectCyclic: false, // cyclic will be ordered, but not promise the runing correctness
        extFallbacks: ['.js'] // node is binary and not suitable for concat out
    }, function(err, tree) {
        if (err) return callback(err);
        if (!keepForeign)
            tree = removeForeign(tree);

        callback(err, removeCycle(tree));
        // filter out foreign modules
    });
};


function removeCycle(root) {
    var stack = [],
        visited = {};

    function visit(node) {
        var id = node.id;
        visited[id] = true;
        stack.push(id);


        var deps = node.dependencies;
        if (deps) {
            for (var i = 0; i < deps.length; ++i) {
                var dep = deps[i];
                if (visited[dep.id]) {
                    if (stack.indexOf(dep.id) != -1)
                        deps.splice(i--, 1); // remove backward edge
                } else {
                    visit(dep);
                }
            }
        }

        stack.pop();
    }

    visit(root);

    return root;
}



function removeForeign(node, visited) {
    visited = visited || {}
    if (node) {
        visited[node.id] = true;

        if (node.isForeign)
            return null;

        if (node.dependencies) {
            for (var i = 0; i < node.dependencies.length; ++i) {
                var dep = node.dependencies[i];

                if (dep.isForeign) {
                    node.dependencies.splice(i--, 1);
                    continue;
                }

            }
            node.dependencies.forEach(function(dep) {
                if (visited[dep.id]) return;
                removeForeign(dep, visited);
            });
        }

        return node;
    }

    return null;
}