const test = require('../test-tester.js')

test('This should be run after the tests in that other file', t => {
	t.deepEqual({ yes: true }, { yes: true })
})

test('This one should throw too', t => {
	console.error('oh there will be an error?!?!')
	t.deepEqual({ yes: true }, { yes: false })
	t.ok('wat' === 'WUT')
})
