Work-in-progress.

# Design goals

I really like [`node-tap`](https://github.com/tapjs/node-tap), [`ava`](https://github.com/avajs/ava), and [`tape`](https://github.com/substack/tape).  My design goals are mostly a combination of the goals of these great libraries:

1. [`power-assert`](https://github.com/power-assert-js/power-assert)'s great error messages (ava)
2. Run in the browser (tape)
3. Be able to run a file's tests by just evaluating the file (tape, node-tap)
4. As little code as I can get away with

With these niceities:

1. No bundling or transpiling (tape, node-tap)
2. Promise-aware tests, eliminating `end` calls (ava)
3. Run tests concurrently (node-tap, ava) but only in a single-process (for easier browser testing and simpler code)

## Other assertions

- tests results are output in a deterministic order
- tests that do not return a promise are considered synchronous and end immediately
- tests marked serial will not be run concurrently with any other tests
