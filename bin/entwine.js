#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var Story = require('../story');
var StoryFormat = require('../story-format');
var argv = require('yargs')
	.usage('Usage: $0 <files to combine> [options]')
	.alias('f', 'format')
	.describe('format', 'Path to a Twine 2 story format to use')
	.demand('format', 'A story format must be specified')
	.demand(1)
	.help()
	.argv;

var format = new StoryFormat(fs.readFileSync(argv.format, { encoding: 'utf8' }));
var story = new Story();

argv._.forEach(function(srcFile) {
	var src = fs.readFileSync(srcFile, { encoding: 'utf8' });

	switch (path.extname(srcFile)) {
		case 'css':
			story.mergeCss(src);
			break;

		case 'htm':
		case 'html':
			story.mergeHtml(src);
			break;

		case 'js':
			story.mergeJavascript(src);
			break;

		default:
			console.error(
				"Don't know how to merge a file with extension " + path.extname(src)
			);
	}
});

console.log(format.publish(story));