const nextTick = require('iso-next-tick')

const createHarness = require('./create-harness.js')
const defaultOutput = require('./default-output.js')

const harness = createHarness()
defaultOutput(harness)

module.exports = harness

nextTick(() => harness.runTests().then(({ pass, fail }) => {
	if (fail > 0) {
		process.exit(1)
	}
}))
