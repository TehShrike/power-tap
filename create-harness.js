const EventEmitter = require('eventemitter3')
const noThrow = require('assert-no-throw')
const rawAssert = require('power-assert')

const defaultOptions = {
	shouldThrow: false
}

// instead of running the tests right away, put them on a queue
module.exports = function createTestHarness({ shouldThrow } = defaultOptions) {
	const testQueue = []

	const harness = makeEmitter(function test(description, fn, ...args) {
		testQueue.push({
			description,
			fn,
			args
		})
	})

	harness.runTests = function runTests() {
		Object.freeze(testQueue)
		let pass = 0
		let fail = 0

		const promises = testQueue.map(({ description, fn, args }) => {
			const { results, assert } = noThrow(rawAssert)
			let plannedTests = null

			const testApi = Object.create(assert)
			testApi.plan = function plan(expectedTests) {
				if (typeof expectedTests !== 'number') {
					assert.fail(typeof expectedTests, 'number', 'plan() was called without a number')
				} else if (plannedTests !== null) {
					assert.fail(expectedTests, null, 'plan() was called more than once')
				} else {
					plannedTests = expectedTests
				}
			}

			function reportSingleTestResults() {
				harness.emit('test name', description)
				if (plannedTests !== null && results.length !== plannedTests) {
					assert.fail(results.length, plannedTests, 'plan != count')
				}
				results.forEach(result => {
					harness.emit('test', {
						ok: result.pass,
						description: typeof result.description === 'string' ? result.description : result.method
					})

					if (result.error) {
						harness.emit('error', result.error)
						fail++
					} else {
						pass++
					}
				})
			}

			function handleError(err) {
				assert.ifError(err || 'Test errored!')
				reportSingleTestResults()
			}

			const potentialPromise = tryf(() => fn(testApi, ...args), handleError)

			const isAsync = isThenable(potentialPromise)

			if (isAsync) {
				return Promise.resolve(potentialPromise)
					.then(reportSingleTestResults)
					.catch(handleError)
			} else {
				reportSingleTestResults()
				return Promise.resolve()
			}
		})

		return Promise.all(promises).then(() => {
			harness.emit('plan', {
				start: 1,
				end: testQueue.length
			})
			harness.emit('diagnostic', `tests ${pass + fail}`)
			harness.emit('diagnostic', `pass  ${pass}`)
			harness.emit('diagnostic', `fail  ${fail}`)

			return { pass, fail }
		})
	}

	return harness
}

const tryf = (fn, catchFn) => {
	try {
		return fn()
	} catch (err) {
		return catchFn(err)
	}
}

function makeEmitter(fn) {
	const emitter = new EventEmitter()
	Object.keys(EventEmitter.prototype).filter(function(key) {
		return typeof EventEmitter.prototype[key] === 'function'
	}).forEach(function(key) {
		fn[key] = EventEmitter.prototype[key].bind(emitter)
	})
	return fn
}

function isThenable(o) {
	return o
		&& (typeof o === 'object' || typeof o === 'function')
		&& typeof o.then === 'function'
}
