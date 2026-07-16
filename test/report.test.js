import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calcStageDeviation,
  generateTrainingReport,
  getMarkerIntervals,
  getScoreLevel
} from '../utils/report.js'

test('score levels cover their boundaries', () => {
  assert.equal(getScoreLevel(90), '优秀')
  assert.equal(getScoreLevel(80), '良好')
  assert.equal(getScoreLevel(70), '合格')
  assert.equal(getScoreLevel(60), '合格')
  assert.equal(getScoreLevel(59), '需改进')
})

test('marker analysis identifies the longest interval', () => {
  const intervals = getMarkerIntervals([
    { id: 'c', timeSeconds: 90, type: '结束' },
    { id: 'a', timeSeconds: 10, type: '开始' },
    { id: 'b', timeSeconds: 30, type: '中间' }
  ])
  assert.equal(intervals.length, 2)
  assert.equal(intervals.find((item) => item.isLongest).durationSeconds, 60)
})

test('stage deviation and report use actual stage timing', () => {
  const stages = [{ id: 's1', name: '演示', minutes: 1, usedSeconds: 80 }]
  const deviations = calcStageDeviation(stages)
  assert.equal(deviations[0].deviationSeconds, 20)
  const report = generateTrainingReport({
    templateName: '测试模板',
    usedSeconds: 80,
    totalScore: 90,
    scores: [],
    markers: [],
    stages
  })
  assert.match(report, /演示/)
  assert.match(report, /超出 0分20秒/)
})
