const test = require('../test-tester.js')

console.log('Test file!!!!!!')

test('Run basic synchronous assertion', hurk => {
	console.log('inside first test')
	hurk.equal(1, 1)
})

test('Run basic async test', t => {
	return new Promise(resolve => {
		t.equal(2, 2)
		resolve()
	})
})

test('This one should throw', t => {
	console.error('oh there will be an error')
	t.deepEqual({ yes: true }, { yes: false }, 'some message or whatever')
	t.ok('wat' === 'WUT')
})
