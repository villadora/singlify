/**
 * Return topsorted array
 */

module.exports = function(tree) {
    if (!tree) return [];

    var incomings = {},
        queue = [tree],
        visited = {},
        node;

    while (node = queue.shift()) {
        var id = node.id;
        // mark visited
        visited[id] = true;

        var dependencies = node.dependencies || []; // don't use dependents as dependents may continas cycle

        // skip if visted already
        Array.prototype.push.apply(queue, dependencies.filter(function(dep) {
            return !visited[dep.id];
        }) || []);


        dependencies.forEach(function(dep) {
            var income = incomings[dep.id] = incomings[dep.id] || [];
            if (income.indexOf(id) == -1)
                income.push(id);
        });
    }

    // do sort
    queue = [tree];
    var sort = [],
        node;
    while (node = queue.shift()) {
        sort.push(node);
        var dependencies = node.dependencies || [];
        dependencies.forEach(function(dep) {
            var income = incomings[dep.id] || [];
            var idx = income.indexOf(node.id);
            if (idx != -1) {
                income.splice(idx, 1);
            }

            if (!income.length) {
                queue.push(dep);
            }
        });
    }

    return sort;
};

function gId(node) {
    var id = node;
    if (typeof node !== 'string')
        id = node.id;
    return id.substr(id.lastIndexOf('/') + 1);
}