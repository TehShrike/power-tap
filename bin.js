#!/usr/bin/env node

const pattern = process.argv[2]

require('espower-loader')({
	pattern,
	espowerOptions: {
		patterns: [
			't.ok(value, [message])',
			't.equal(actual, expected, [message])',
			't.notEqual(actual, expected, [message])',
			't.strictEqual(actual, expected, [message])',
			't.notStrictEqual(actual, expected, [message])',
			't.deepEqual(actual, expected, [message])',
			't.notDeepEqual(actual, expected, [message])',
			't.deepStrictEqual(actual, expected, [message])',
			't.notDeepStrictEqual(actual, expected, [message])'
		]
	}
})

const glob = require('glob')
const path = require('path')

const testFiles = glob.sync(pattern)

testFiles.forEach(file => require(path.resolve(file)))
