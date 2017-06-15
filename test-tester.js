require('loud-rejection')()

const useTape = process.env.TESTER !== 'power-tap'

if (useTape) {
	const tape = require('tape')
	module.exports = function fauxTape(...args) {
		let resolve = null
		const promise = new Promise(originalResolve => {
			resolve = originalResolve
		})

		const testFunction = args.pop()
		tape(...args, t => {
			Promise.resolve(testFunction(t)).then(result => {
				t.end()
				resolve(result)
			}).catch(error => {
				t.onError(error)
				resolve()
			})
		})

		return promise
	}
} else {
	module.exports = require('./index.js')
}
