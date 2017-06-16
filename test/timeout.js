const test = require('../test-tester.js')
const createHarness = require('../create-harness.js')

test('tests fail if they last longer than their timeout', t => {
	const harness = createHarness()

	let startTime = null
	harness('Some test', harnessAssert => {
		startTime = Date.now()
		harnessAssert.timeoutAfter(1000)

		return new Promise(resolve => {
			setTimeout(() => {
				harnessAssert.ok(true, 'should not show up')
				resolve()
			}, 3000)
		})
	})

	let testErrorHappened = false
	harness.on('test', ({ message }) => {
		t.ok(/^test timed out after/.test(message), 'message starts with "test timed out after"')
		testErrorHappened = true
	})

	return harness.runTests().then(() => {
		const endTime = Date.now()

		const elapsed = endTime - startTime

		t.ok(testErrorHappened, 'test error was emitted')
		t.ok(elapsed >= 1000, 'Took at least 1 second')
		t.ok(elapsed < 2000, 'Took less than 2 seconds')
	})
})
