const tap = require('tap-strings')

module.exports = function outputToConsoleLog(harness) {
	const realConsole = interceptConsole(harness)
	const log = str => realConsole.log(str)

	let testNumber = 0
	let immediatelyAfterTest = false
	const isTest = fn => (...args) => (immediatelyAfterTest = true, fn(...args))
	const isNotTest = fn => (...args) => (immediatelyAfterTest = false, fn(...args))
	const assertIsAfterTest = fn => (...args) => {
		if (!immediatelyAfterTest) {
			throw new Error('Can only do that after a test')
		}
		return fn(...args)
	}

	log(tap.version(13))
	harness.on('test', isTest(({ ok, message }) => log(tap.test(ok, ++testNumber, message))))

	harness.on('plan', isNotTest(({ start, end }) => log(tap.plan(start, end))))
	const diagnosticOutput = isNotTest(message => log(tap.diagnostic(message)))

	harness.on('test name', diagnosticOutput)
	harness.on('diagnostic', diagnosticOutput)
	harness.on('error', assertIsAfterTest(isNotTest(error => log(tap.message(error.message)))))
}


function interceptConsole(harness) {
	const realConsole = {}

	Object.keys(console).forEach(key => {
		realConsole[key] = console[key]
		console[key] = (...args) => {
			harness.emit('diagnostic', key + ': ' + args.join(' '))
		}
	})

	return realConsole
}
