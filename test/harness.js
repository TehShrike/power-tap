const test = require('../test-tester.js')
const createHarness = require('../create-harness.js')

test('Emits test name', t => {
	t.plan(1)
	const harness = createHarness()
	harness.on('test name', name => {
		t.equal(name, 'this is the test name')
	})
	harness('this is the test name', () => {})
	return harness.runTests()
})

test('Emits an error when an assert fails', t => {
	t.plan(3)

	const harness = createHarness()
	harness.on('error', error => {
		t.equal(error.actual, true)
		t.equal(error.expected, false)
		t.equal(typeof error.message, 'string')
	})
	harness('this is the test name', harnessAssert => {
		harnessAssert.equal(true, false)
	})

	return harness.runTests()
})

test('Emits an error when the plan is not met', t => {
	t.plan(2)

	const harness = createHarness()

	harness.on('error', error => {
		t.equal(error.actual, 0)
		t.equal(error.expected, 1)
	})
	harness('this is the test name', harnessAssert => {
		harnessAssert.plan(1)
	})

	return harness.runTests()
})
