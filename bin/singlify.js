#!/usr/bin/env node

var path = require('path');

var argv = require('minimist')(process.argv.slice(2));

if (argv.version || argv.v) {
	var pkg = require('../package.json');
	console.log([pkg.name, 'v' + pkg.version].join(' '));
	process.exit(0);
}



if (argv.help || argv.h) {
	console.log("Usage: singlify [options] [-e exports] [-o outputFile] entry\n");
	console.log("Options:");
	console.log("  -v, --version\tprint version");
	console.log("  -x, --exports exportName\tname of main module");
	console.log("  -o, --output outputFile\t output will write to");
	process.exit(0);
}


if (argv._.length < 1 || !argv._[0]) {
	console.error("Please provide entry file!");
	process.exit(1);
}

var entry = argv._[0];

var exportAs = argv.exports || argv.x,
	outputFile = argv.output || argv.o,
	// TODO:
	aliasTo = argv.alias || argv.a;


if (outputFile) {
	outputFile = path.resolve(process.cwd(), outputFile);
}


var singlify = require('../lib');

singlify({
	root: entry,
	exportAs: exportAs
}, function(err, output) {
	if (outputFile) {
		require('fs').writeFile(outputFile, output, function(err) {
			if (err) {
				console.error(err);
				process.exit(1);
			}
		});
	} else {
		console.log(output);
	}
});