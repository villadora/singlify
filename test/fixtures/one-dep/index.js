var a = require('./a');

exports = {};

exports.mod = a.a;

module['exports'] = {
    name: 'index.js'
};

(function(require, exports) {
    var module = {};
    module.exports = new Date();
    exports.mod = '1';

    require('hello');
})(function(a) {
    console.log(a);
}, {});