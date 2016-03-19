'use strict';
var cheerio = require('cheerio');
var Passage = require('./passage');

function Story(props) {
	props = props || {};
	this.attributes = props.attributes || {};

	// Set ourselves as the story creator by default.

	if (this.attributes.creator === undefined) {
		this.attributes.creator = 'twine-utils';
	}

	this.passages = props.passages || [];
	this.javascript = props.javascript || '';
	this.stylesheet = props.stylesheet || '';
};

Object.assign(Story.prototype, {
	// Loads the contents of an HTML file, replacing properties of this story.

	loadHtml: function(source) {
		var $ = cheerio.load(source);
		var $story = $('tw-storydata');

		if ($story.length == 0) {
			console.error('Warning: there are no stories in this HTML source code.');
			return;
		}
		else if ($story.length > 1) {
			console.error('Warning: there appears to be more than one story ' +
				'in this HTML source code. Using the first.');
		}

		this.attributes = $story[0].attribs;
		this.passages = [];

		$story.find('tw-passagedata').each(function(index, el) {
			var passage = new Passage().loadHtml(cheerio.html(el))

			this.passages.push(passage);

			if (passage.attributes.pid === this.attributes.startnode) {
				this.startPassage = passage;
			}
		}.bind(this));

		this.stylesheet = $story.find('script[type="text/twine-css"]').html();
		this.javascript = $story.find('script[type="text/twine-javascript"]').html();

		return this;
	},

	// Merges the contents of another story object with this one.

	mergeStory: function(story) {
		if (story.passages.length !== 0) {
			this.passages = this.passages.concat(story.passages);
		}

		if (story.stylesheet !== '') {
			this.mergeStylesheet(story.stylesheet);
		}

		if (story.javascript !== '') {
			this.mergeJavaScript(story.javascript);
		}

		// Fill in any undefined attributes.

		Object.keys(story.attributes).forEach(function(attrib) {
			if (this.attributes[attrib] === undefined) {
				this.attributes[attrib] = story.attributes[attrib];
			}
		}.bind(this));

		return this;
	},

	// A convenience method that merges the contents of a story in HTML form.

	mergeHtml: function(source) {
		var toMerge = new Story().loadHtml(source);
		this.mergeStory(toMerge);
	},

	// Merges JavaScript source in with this story.

	mergeJavaScript: function(source) {
		this.javascript += '\n' + source;
		return this;
	},

	// Merges CSS source in with this story.

	mergeStylesheet: function(source) {
		this.stylesheet += '\n' + source;
		return this;
	},

	// Returns an HTML fragment for this story. Normally, you'd use a
	// StoryFormat to bind it as a complete HTML page.

	toHtml: function() {
		var output = cheerio.load('<tw-storydata></tw-storydata>');

		output('tw-storydata')
			.attr(this.attributes)
			.attr('startnode', this.passages.indexOf(this.startPassage) + 1)
			.html(this.passages.reduce(
				function(result, passage, index) {
					result += passage.toHtml(index + 1);
					return result;
				},
				''
			))
			.append('<style role="stylesheet" id="twine-user-stylesheet" ' +
				'type="text/twine-css"></style><script role="script" ' +
				'id="twine-user-script" type="text/twine-javascript">' +
				'</script>');

		output('#twine-user-script').html(this.javascript);
		output('#twine-user-stylesheet').html(this.stylesheet);

		return output.html();
	}
});

module.exports = Story;