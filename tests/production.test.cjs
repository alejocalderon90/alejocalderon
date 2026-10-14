const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, needsReview, summarize } = require('../demos/sc-johnson/model.js');
const lot = overrides => ({ planned: 1000, produced: 1000, rejected: 10, downtime: 10, ...overrides });
test('quality rules route deviations and respect the exact threshold', () => {
  assert.equal(needsReview(lot({ rejected: 20, downtime: 30 })), false);
  assert.equal(needsReview(lot({ rejected: 21 })), true);
  assert.equal(needsReview(lot({ downtime: 31 })), true);
});
test('aggregated rejection is weighted by production volume', () => {
  const result = summarize([lot({ produced: 100, rejected: 10 }), lot({ produced: 900, rejected: 9 })]);
  assert.equal(result.good, 981);
  assert.equal(result.rejection, .019);
  assert.equal(result.performance, .5);
});
test('reject counts cannot exceed produced units', () => {
  assert.throws(() => validate(lot({ produced: 100, rejected: 101 })));
});
test('invalid, fractional and out-of-range inputs are rejected', () => {
  for (const overrides of [{ planned: 0 }, { produced: 0 }, { rejected: -1 }, { downtime: 481 }, { produced: 100001 }, { rejected: NaN }, { planned: 1.5 }]) {
    assert.throws(() => validate(lot(overrides)));
  }
});
test('empty reports have finite zero-valued indicators', () => {
  const result = summarize([]);
  for (const value of Object.values(result)) assert.equal(value, 0);
});
test('an approved deviation keeps its rejected units in the report', () => {
  const row = validate(lot({ produced: 1080, rejected: 45, downtime: 42 }));
  assert.equal(needsReview(row), true);
  const report = summarize([row]);
  assert.equal(report.good, 1035);
  assert.equal(report.rejected, 45);
  assert.equal(report.downtime, 42);
});
