function ModuleMgr() {
    this._uses = {};
    this._defs = {};
    this._exports = {};
    this._blocks = {};

    this.prefixes = [];
}


module.exports = function() {
    return new ModuleMgr();
};

module.exports.ModuleMgr = ModuleMgr;

ModuleMgr.prototype.getBlock = function(id) {
    return this._blocks[id];
};

ModuleMgr.prototype.addBlock = function(id, block) {
    this._blocks[id] = block;
};

ModuleMgr.prototype.addUse = function(id, requireNode) {
    var list = this._uses[id] = this._uses[id] || [];
    if (list.indexOf(requireNode) == -1) {
        list.push(requireNode);
    }
};

ModuleMgr.prototype.addDef = function(id, moduleNode) {
    var list = this._defs[id] = this._defs[id] || [];
    if (list.indexOf(moduleNode) == -1) {
        list.push(moduleNode);
    }
};


ModuleMgr.prototype.addExports = function(id, exportsNode) {
    var list = this._exports[id] = this._exports[id] || [];
    if (list.indexOf(exportsNode) == -1) {
        list.push(exportsNode);
    }
};



/**
 * transform the ast and expressions for specified id
 * @param {Array.<string>} a group of ids
 * @param {function} exprGen
 * @param {function(Array.<ast>, Array.<ast>, Array.<ast>)} transformFn this function will run in context of {id:id, expr: expr}
 */
ModuleMgr.prototype.transform = function(ids, exprGen, transformFn) {
    var self = this;
    ids.forEach(function(id, i) {
        var expr = exprGen(id);


        self._transform(id, expr, transformFn || function(reqs, mods, expts) {
            var expr = this.expr;

            // assign require(id) to expr
            (reqs || []).forEach(function(req) {
                replaceExpr(req, expr);
            });

            // module.exports => expr
            (mods || []).forEach(function(mod) {
                replaceExpr(mod, expr);
            });
        });
    });
};


function replaceExpr(origin, copy) {
    for (var p in origin) {
        delete origin[p];
    }

    for (var p in copy) {
        origin[p] = copy[p];
    }
}

ModuleMgr.prototype._transform = function(id, expr, transformFn) {
    transformFn.call({
        id: id,
        expr: expr
    }, this._uses[id], this._defs[id], this._exports[id]);
};