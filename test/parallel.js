const test = require('../test-tester.js')
const createHarness = require('../create-harness.js')

test('Tests run in parallel, but emit results in original order', t => {
	const harness = createHarness()

	let slowTestRunning = false

	harness('slow test', harnessAssert => {
		return new Promise(resolve => {
			slowTestRunning = true
			setTimeout(() => {
				harnessAssert.ok(true, 'slow')
				resolve()
			}, 2000)
		})
	})
	harness('faster test', harnessAssert => {
		return new Promise(resolve => {
			setTimeout(() => {
				t.ok(slowTestRunning, 'The slow test is in progress while the faster test is running')
				harnessAssert.ok(true, 'faster')
				resolve()
			}, 1000)
		})
	})

	let testsEmitted = 0

	harness.on('test', ({ ok, message }) => {
		t.ok(ok)
		testsEmitted++

		if (testsEmitted === 1) {
			t.equal(message, 'slow', 'The slow test is emitted first because it was started first')
		} else {
			t.equal(message, 'faster', 'The fast test emits last even though it finished first')
		}
	})

	return harness.runTests().then(() => {
		t.equal(testsEmitted, 2)
	})
})
