module.exports = {};

var a = '1';

(function(require) {
    require('hello');
})(function(a) {
    console.log(a);
});

exports.a = '1';