import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calcTimeDiff,
  formatDuration,
  formatMMSS,
  minutesToSeconds,
  secondsToTimeParts,
  timePartsToSeconds
} from '../utils/time.js'

test('time conversion clamps invalid and negative values', () => {
  assert.equal(minutesToSeconds(2.5), 150)
  assert.equal(minutesToSeconds(-2), 0)
  assert.equal(timePartsToSeconds(2, 75), 195)
  assert.deepEqual(secondsToTimeParts(-5), { minutes: 0, seconds: 0 })
})

test('time difference rejects reversed ranges', () => {
  assert.deepEqual(calcTimeDiff(30, 95), {
    ok: true,
    totalSeconds: 65,
    minutes: 1,
    seconds: 5,
    error: ''
  })
  assert.equal(calcTimeDiff(95, 30).ok, false)
})

test('duration formatters produce stable labels', () => {
  assert.equal(formatMMSS(65), '01:05')
  assert.equal(formatDuration(0), '0分0秒')
  assert.equal(formatDuration(3661), '61分1秒')
})
