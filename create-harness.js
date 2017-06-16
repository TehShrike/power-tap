const EventEmitter = require('eventemitter3')
const noThrow = require('assert-no-throw')
const rawAssert = require('power-assert')
const pRace = require('p-race')
const delay = require('delay')

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

		function emitTestResults(results) {
			results.forEach(result => {
				harness.emit('test', {
					ok: result.pass,
					message: result.message || result.method
				})

				if (result.error) {
					harness.emit('error', result.error)
					fail++
				} else {
					pass++
				}
			})
		}

		const promises = testQueue.map(({ description, fn, args }) => {
			const results = []
			const catcher = noThrow(rawAssert)
			const assert = catcher.assert
			let done = false
			catcher.on('assert', result => {
				if (!done) {
					results.push(result)
				}
			})
			let plannedTests = null
			let timeoutAfterMs = 5000

			const testApi = Object.assign({
				plan(expectedTests) {
					if (typeof expectedTests !== 'number') {
						assert.fail(typeof expectedTests, 'number', 'plan() was called without a number')
					} else if (plannedTests !== null) {
						assert.fail(expectedTests, null, 'plan() was called more than once')
					} else {
						plannedTests = expectedTests
					}
				},
				timeoutAfter(ms) {
					if (typeof ms !== 'number') {
						assert.fail(typeof ms, 'number', 'timeoutAfter() was called without a number')
					} else {
						timeoutAfterMs = ms
					}
				}
			}, assert)

			function completeSingleTest() {
				if (plannedTests !== null && results.length !== plannedTests) {
					assert.fail(results.length, plannedTests, 'plan != count')
				}

				done = true

				return {
					description,
					results: Object.freeze(results)
				}
			}

			function handleError(err) {
				assert.ifError(err || 'Test errored!')
				return completeSingleTest()
			}

			const potentialPromise = tryf(() => fn(testApi, ...args), handleError)

			const isAsync = isThenable(potentialPromise)

			if (isAsync) {
				const timeoutAfterPromise = delay(timeoutAfterMs).then(() => {
					assert.fail(null, null, `test timed out after ${timeoutAfterMs}ms`)
				})

				return pRace([
					Promise.resolve(potentialPromise),
					timeoutAfterPromise
				]).then(completeSingleTest).catch(handleError)
			} else {
				return Promise.resolve(completeSingleTest())
			}
		})

		return Promise.all(promises).then(allTests => {
			allTests.forEach(({ description, results }) => {
				harness.emit('test name', description)
				emitTestResults(results)
			})

			harness.emit('plan', {
				start: 1,
				end: pass + fail
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
