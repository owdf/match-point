import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const values = new Map()
globalThis.uni = {
  getStorageSync(key) {
    return values.get(key)
  },
  setStorageSync(key, value) {
    values.set(key, structuredClone(value))
  },
  removeStorageSync(key) {
    values.delete(key)
  }
}

const storage = await import('../utils/storage.js')

beforeEach(() => values.clear())

test('default templates initialize once', () => {
  assert.equal(storage.getTemplates().length, 4)
  assert.equal(storage.getTemplates().length, 4)
})

test('backup import replaces stale draft and clamps invalid data', () => {
  storage.saveCurrentTraining({ id: 'stale', totalScore: 20 })
  const result = storage.importLocalBackupData({
    templates: [{
      id: 'custom',
      name: '异常模板',
      totalMinutes: -5,
      targetMinutes: 999,
      stages: []
    }],
    records: [{
      id: 'record-1',
      totalScore: 999,
      scores: [{ name: '时间控制', maxScore: 20, score: 99 }]
    }],
    settings: { theme: 'light' }
  })

  assert.deepEqual(result, { templateCount: 1, recordCount: 1 })
  assert.equal(storage.getCurrentTraining(), null)
  const template = storage.getTemplateById('custom')
  assert.equal(template.totalMinutes, 1)
  assert.equal(template.targetMinutes, 1)
  assert.equal(template.stages.length, 1)
  const record = storage.getTrainingRecordById('record-1')
  assert.equal(record.totalScore, 100)
  assert.equal(record.level, '优秀')
  assert.equal(record.scores[0].score, 20)
})

test('backup round trip preserves records and current training', () => {
  storage.saveTrainingRecord({ id: 'record-1', templateName: '训练', totalScore: 88 })
  storage.saveCurrentTraining({ id: 'draft-1', templateId: 'default-60min', running: false })
  const backup = storage.exportLocalBackupText()
  storage.clearAllLocalData()
  storage.importLocalBackupData(backup)
  assert.equal(storage.getTrainingRecords().length, 1)
  assert.equal(storage.getCurrentTraining().id, 'draft-1')
})
