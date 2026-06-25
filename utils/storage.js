import { calcStageDeviation, getScoreLevel } from './report.js'
import { formatDuration, getFormattedDate } from './time.js'

export const TEMPLATE_KEY = 'skill_training_templates'
export const RECORD_KEY = 'skill_training_records'
export const CURRENT_TRAINING_KEY = 'skill_current_training'
export const PRECHECK_KEY = 'MATCH_POINT_PRECHECK'
export const SETTINGS_KEY = 'MATCH_POINT_SETTINGS'
export const BACKUP_VERSION = '1.3.0'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function readStorage(key, defaultValue) {
  try {
    const value = uni.getStorageSync(key)
    return value === undefined || value === null || value === '' ? defaultValue : value
  } catch (error) {
    return defaultValue
  }
}

function writeStorage(key, value) {
  uni.setStorageSync(key, value)
}

function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    writeStorage(key, null)
  }
}

const checklistTexts = [
  ['训练前', '设备是否通电'],
  ['训练前', '程序是否能正常运行'],
  ['训练前', '演示材料是否准备'],
  ['训练前', 'PPT或讲解材料是否打开'],
  ['训练前', '摄像头、传感器、电机等关键模块是否检查'],
  ['训练前', '是否准备备用方案'],
  ['训练中', '是否说明项目背景'],
  ['训练中', '是否说明系统架构'],
  ['训练中', '是否说明核心功能'],
  ['训练中', '是否完成实物或系统演示'],
  ['训练中', '是否说明项目亮点'],
  ['训练中', '是否控制在目标时间内'],
  ['训练后', '是否记录超时原因'],
  ['训练后', '是否记录设备问题'],
  ['训练后', '是否记录表达问题'],
  ['训练后', '是否记录演示卡顿问题'],
  ['训练后', '是否总结下次改进方向']
]

const defaultScoreItems = [
  ['时间控制', 20],
  ['技术说明', 20],
  ['系统演示', 20],
  ['操作规范', 15],
  ['表达流畅度', 10],
  ['现场稳定性', 10],
  ['创新展示', 5]
]

const precheckTexts = [
  ['设备检查', ['设备是否通电', '电源线是否连接稳定', '数据线是否齐全', '关键模块是否固定', '传感器是否正常', '摄像头是否正常', '电机或执行器是否正常']],
  ['材料检查', ['PPT是否能正常打开', '演示文稿是否为最终版本', '讲解稿是否准备', '评分标准是否查看', '备用资料是否准备']],
  ['程序检查', ['程序是否能正常启动', '核心功能是否能运行', '测试数据是否准备', '异常情况是否测试', '是否关闭无关软件']],
  ['演示检查', ['演示流程是否熟悉', '关键亮点是否明确', '讲解顺序是否清楚', '是否预留总结时间']],
  ['备用方案', ['备用电源是否准备', '备用数据线是否准备', '程序异常时是否有说明方案', '设备异常时是否有替代演示方案']]
]

function createChecklist() {
  return checklistTexts.map(([category, text], index) => ({
    id: `check-${index + 1}`,
    category,
    text,
    checked: false
  }))
}

function createScoreItems() {
  return defaultScoreItems.map(([name, maxScore], index) => ({
    id: `score-${index + 1}`,
    name,
    maxScore,
    score: 0,
    reasons: []
  }))
}

function normalizeScoreItem(item = {}, index = 0) {
  return {
    id: item.id || `score-${index + 1}`,
    name: item.name || defaultScoreItems[index]?.[0] || '评分项',
    maxScore: Number(item.maxScore) || defaultScoreItems[index]?.[1] || 0,
    score: Math.max(0, Number(item.score) || 0),
    reasons: Array.isArray(item.reasons) ? item.reasons.filter(Boolean) : []
  }
}

function normalizeStage(stage = {}, index = 0) {
  const nextStage = {
    id: stage.id || `stage-${index + 1}`,
    name: stage.name || `阶段${index + 1}`,
    minutes: Number(stage.minutes) || 0
  }

  if (stage.plannedSeconds !== undefined) nextStage.plannedSeconds = Number(stage.plannedSeconds) || 0
  if (stage.usedSeconds !== undefined) nextStage.usedSeconds = Math.max(0, Math.floor(Number(stage.usedSeconds) || 0))
  if (stage.usedMilliseconds !== undefined) nextStage.usedMilliseconds = Math.max(0, Math.floor(Number(stage.usedMilliseconds) || 0))

  return nextStage
}

function normalizeMarker(marker = {}, index = 0) {
  const timeSeconds = Math.max(0, Math.floor(Number(marker.timeSeconds) || Math.floor((Number(marker.timeMilliseconds) || 0) / 1000)))
  return {
    id: marker.id || `marker-${index + 1}`,
    timeSeconds,
    timeMilliseconds: marker.timeMilliseconds !== undefined ? Math.max(0, Math.floor(Number(marker.timeMilliseconds) || 0)) : undefined,
    timeText: marker.timeText || formatDuration(timeSeconds),
    stageName: marker.stageName || '',
    type: marker.type || '未分类',
    note: marker.note || '',
    createdAt: marker.createdAt || ''
  }
}

function normalizeStageDeviation(item = {}, index = 0) {
  const plannedSeconds = Math.max(0, Math.floor(Number(item.plannedSeconds) || 0))
  const actualSeconds = Math.max(0, Math.floor(Number(item.actualSeconds) || 0))
  const rawDeviation = Number(item.deviationSeconds)
  const deviationSeconds = Number.isNaN(rawDeviation) ? actualSeconds - plannedSeconds : Math.floor(rawDeviation)
  return {
    id: item.id || `stage-deviation-${index + 1}`,
    name: item.name || `阶段${index + 1}`,
    plannedSeconds,
    actualSeconds,
    deviationSeconds,
    plannedText: item.plannedText || formatDuration(plannedSeconds),
    actualText: item.actualText || formatDuration(actualSeconds),
    deviationText: item.deviationText || formatDuration(Math.abs(deviationSeconds)),
    resultText: item.resultText || (deviationSeconds > 0 ? `超出${formatDuration(deviationSeconds)}` : deviationSeconds < 0 ? `节省${formatDuration(Math.abs(deviationSeconds))}` : '持平')
  }
}

function normalizeTrainingRecord(record = {}) {
  const stages = Array.isArray(record.stages) ? record.stages.map(normalizeStage) : []
  const explicitStageDeviations = Array.isArray(record.stageDeviations) ? record.stageDeviations.map(normalizeStageDeviation) : []
  const computedStageDeviations = explicitStageDeviations.length ? explicitStageDeviations : calcStageDeviation(stages)
  const usedMilliseconds = Math.max(0, Math.floor(Number(record.usedMilliseconds) || 0))
  const usedSeconds = Math.max(0, Math.floor(Number(record.usedSeconds) || (usedMilliseconds ? Math.floor(usedMilliseconds / 1000) : 0)))

  return {
    ...clone(record),
    id: record.id || createId('record'),
    templateId: record.templateId || '',
    templateName: record.templateName || '',
    startedAt: record.startedAt || '',
    endedAt: record.endedAt || '',
    totalSeconds: Math.max(0, Math.floor(Number(record.totalSeconds) || 0)),
    targetSeconds: Math.max(0, Math.floor(Number(record.targetSeconds) || 0)),
    usedSeconds,
    usedMilliseconds,
    isOvertime: Boolean(record.isOvertime),
    stages,
    checklist: Array.isArray(record.checklist) ? clone(record.checklist) : [],
    markers: Array.isArray(record.markers) ? record.markers.map(normalizeMarker) : [],
    stageDeviations: computedStageDeviations,
    scores: Array.isArray(record.scores) ? record.scores.map(normalizeScoreItem) : [],
    totalScore: Number(record.totalScore) || 0,
    level: record.level || getScoreLevel(record.totalScore),
    notes: record.notes || '',
    nextPlan: record.nextPlan || '',
    report: record.report || '',
    reportImagePath: record.reportImagePath || '',
    createdAt: record.createdAt || new Date().toISOString()
  }
}

function normalizeTemplate(template = {}) {
  return {
    ...clone(template),
    id: template.id || createId('template'),
    name: template.name || '未命名模板',
    totalMinutes: Number(template.totalMinutes) || 60,
    targetMinutes: Number(template.targetMinutes) || Number(template.totalMinutes) || 60,
    stages: Array.isArray(template.stages) ? template.stages.map(normalizeStage) : [],
    checklist: Array.isArray(template.checklist) && template.checklist.length ? clone(template.checklist) : createChecklist(),
    scoreItems: Array.isArray(template.scoreItems) && template.scoreItems.length ? template.scoreItems.map(normalizeScoreItem) : createScoreItems(),
    isDefault: Boolean(template.isDefault),
    createdAt: template.createdAt || new Date().toISOString()
  }
}

function createTemplate(id, name, totalMinutes, targetMinutes, stages) {
  return {
    id,
    name,
    totalMinutes,
    targetMinutes,
    stages: stages.map((item, index) => ({
      id: `${id}-stage-${index + 1}`,
      name: item.name,
      minutes: item.minutes
    })),
    checklist: createChecklist(),
    scoreItems: createScoreItems(),
    isDefault: true,
    createdAt: '2026-05-06 00:00'
  }
}

export function getDefaultTemplates() {
  return [
    createTemplate('default-60min', '60分钟技能比赛训练', 60, 55, [
      { name: '设备检查', minutes: 5 },
      { name: '项目介绍', minutes: 8 },
      { name: '技术说明', minutes: 15 },
      { name: '系统演示', minutes: 20 },
      { name: '总结复盘', minutes: 7 },
      { name: '弹性时间', minutes: 5 }
    ]),
    createTemplate('default-55min', '55分钟冲刺训练', 55, 50, [
      { name: '准备检查', minutes: 5 },
      { name: '重点说明', minutes: 15 },
      { name: '系统演示', minutes: 25 },
      { name: '总结收尾', minutes: 10 }
    ]),
    createTemplate('default-defense', '项目答辩训练', 20, 18, [
      { name: '项目背景', minutes: 3 },
      { name: '技术方案', minutes: 5 },
      { name: '系统演示', minutes: 8 },
      { name: '总结亮点', minutes: 4 }
    ]),
    createTemplate('default-device', '设备调试训练', 45, 40, [
      { name: '设备检查', minutes: 8 },
      { name: '程序运行', minutes: 10 },
      { name: '功能测试', minutes: 15 },
      { name: '问题排查', minutes: 8 },
      { name: '记录总结', minutes: 4 }
    ])
  ]
}

export function initDefaultTemplates() {
  const defaults = getDefaultTemplates().map(normalizeTemplate)
  const stored = readStorage(TEMPLATE_KEY, [])

  if (!Array.isArray(stored) || !stored.length) {
    writeStorage(TEMPLATE_KEY, defaults)
    return clone(defaults)
  }

  const normalizedStored = stored.map(normalizeTemplate)
  const storedIds = normalizedStored.map((item) => item.id)
  const missingDefaults = defaults.filter((item) => !storedIds.includes(item.id))
  const merged = missingDefaults.length ? [...missingDefaults, ...normalizedStored] : normalizedStored
  if (missingDefaults.length) writeStorage(TEMPLATE_KEY, merged)

  return clone(merged)
}

export function getTemplates() {
  const templates = initDefaultTemplates()
  return templates.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  })
}

export function getTemplateById(id) {
  return getTemplates().find((item) => item.id === id)
}

export function saveTemplate(template) {
  const templates = getTemplates()
  const now = new Date().toISOString()
  const nextTemplate = normalizeTemplate({
    ...template,
    id: template.id || createId('template'),
    isDefault: false,
    createdAt: template.createdAt || now
  })

  const index = templates.findIndex((item) => item.id === nextTemplate.id)
  if (index >= 0) {
    templates.splice(index, 1, nextTemplate)
  } else {
    templates.push(nextTemplate)
  }

  writeStorage(TEMPLATE_KEY, templates)
  return clone(nextTemplate)
}

export function deleteTemplate(id) {
  const templates = getTemplates().filter((item) => item.id !== id || item.isDefault)
  writeStorage(TEMPLATE_KEY, templates)
}

export function getTrainingRecords() {
  const records = readStorage(RECORD_KEY, [])
  return (Array.isArray(records) ? records : [])
    .map(normalizeTrainingRecord)
    .sort((a, b) => new Date(b.createdAt || b.startedAt) - new Date(a.createdAt || a.startedAt))
}

export function getTrainingRecordById(id) {
  return getTrainingRecords().find((item) => item.id === id)
}

export function saveTrainingRecord(record) {
  const records = getTrainingRecords()
  const nextRecord = normalizeTrainingRecord({
    ...record,
    id: record.id || createId('record'),
    level: record.level || getScoreLevel(record.totalScore),
    createdAt: record.createdAt || new Date().toISOString()
  })

  const index = records.findIndex((item) => item.id === nextRecord.id)
  if (index >= 0) {
    records.splice(index, 1, nextRecord)
  } else {
    records.unshift(nextRecord)
  }

  writeStorage(RECORD_KEY, records)
  return clone(nextRecord)
}

export function deleteTrainingRecord(id) {
  const records = getTrainingRecords().filter((item) => item.id !== id)
  writeStorage(RECORD_KEY, records)
}

export function saveCurrentTraining(training) {
  writeStorage(CURRENT_TRAINING_KEY, normalizeTrainingRecord(training))
}

export function getCurrentTraining() {
  const current = readStorage(CURRENT_TRAINING_KEY, null)
  return current ? normalizeTrainingRecord(current) : null
}

export function clearCurrentTraining() {
  removeStorage(CURRENT_TRAINING_KEY)
}

export function createEmptyTemplate() {
  return {
    id: '',
    name: '',
    totalMinutes: 60,
    targetMinutes: 55,
    stages: [
      { id: createId('stage'), name: '', minutes: 5 }
    ],
    checklist: createChecklist(),
    scoreItems: createScoreItems(),
    isDefault: false,
    createdAt: ''
  }
}

export function getDefaultPrecheckState() {
  return {
    updatedAt: '',
    groups: precheckTexts.map(([name, items], groupIndex) => ({
      name,
      items: items.map((text, itemIndex) => ({
        id: `precheck-${groupIndex + 1}-${itemIndex + 1}`,
        text,
        checked: false
      }))
    }))
  }
}

export function getPrecheckState() {
  const defaults = getDefaultPrecheckState()
  const stored = readStorage(PRECHECK_KEY, null)
  const checkedMap = {}

  if (stored && Array.isArray(stored.groups)) {
    stored.groups.forEach((group) => {
      ;(group.items || []).forEach((item) => {
        checkedMap[item.id] = Boolean(item.checked)
      })
    })
  }

  return {
    updatedAt: stored?.updatedAt || '',
    groups: defaults.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        checked: Boolean(checkedMap[item.id])
      }))
    }))
  }
}

export function savePrecheckState(state) {
  const defaults = getDefaultPrecheckState()
  const sourceGroups = Array.isArray(state?.groups) ? state.groups : defaults.groups
  const nextState = {
    updatedAt: new Date().toISOString(),
    groups: defaults.groups.map((group) => {
      const savedGroup = sourceGroups.find((item) => item.name === group.name) || {}
      const savedItems = Array.isArray(savedGroup.items) ? savedGroup.items : []
      return {
        ...group,
        items: group.items.map((item) => {
          const savedItem = savedItems.find((target) => target.id === item.id)
          return {
            ...item,
            checked: Boolean(savedItem?.checked)
          }
        })
      }
    })
  }
  writeStorage(PRECHECK_KEY, nextState)
  return clone(nextState)
}

export function resetPrecheckState() {
  const state = getDefaultPrecheckState()
  writeStorage(PRECHECK_KEY, state)
  return clone(state)
}

export function getSettings() {
  return clone(readStorage(SETTINGS_KEY, {}))
}

export function saveSettings(settings = {}) {
  writeStorage(SETTINGS_KEY, clone(settings))
}

export function getLocalBackupData() {
  return {
    app: '赛点',
    version: BACKUP_VERSION,
    exportedAt: getFormattedDate(new Date()),
    templates: getTemplates(),
    records: getTrainingRecords(),
    precheck: getPrecheckState(),
    settings: {
      ...getSettings(),
      currentTraining: getCurrentTraining()
    }
  }
}

export function exportLocalBackupText() {
  return JSON.stringify(getLocalBackupData(), null, 2)
}

export function importLocalBackupData(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input
  if (!data || typeof data !== 'object') throw new Error('备份数据格式不正确')
  if (!Array.isArray(data.templates)) throw new Error('备份缺少训练模板数据')
  if (!Array.isArray(data.records)) throw new Error('备份缺少训练记录数据')

  const templates = data.templates.map(normalizeTemplate)
  const records = data.records.map(normalizeTrainingRecord)
  writeStorage(TEMPLATE_KEY, templates)
  writeStorage(RECORD_KEY, records)

  if (data.precheck) savePrecheckState(data.precheck)
  if (data.settings && typeof data.settings === 'object') {
    const { currentTraining, ...settings } = data.settings
    saveSettings(settings)
    if (currentTraining) saveCurrentTraining(currentTraining)
  }

  initDefaultTemplates()

  return {
    templateCount: templates.length,
    recordCount: records.length
  }
}

export function clearAllLocalData() {
  removeStorage(TEMPLATE_KEY)
  removeStorage(RECORD_KEY)
  removeStorage(CURRENT_TRAINING_KEY)
  removeStorage(PRECHECK_KEY)
  removeStorage(SETTINGS_KEY)
  initDefaultTemplates()
}

export function getStatistics() {
  const records = getTrainingRecords()
  const count = records.length
  const totalScore = records.reduce((sum, item) => sum + (Number(item.totalScore) || 0), 0)
  const totalUsedSeconds = records.reduce((sum, item) => sum + (Number(item.usedSeconds) || 0), 0)
  const highestScore = records.reduce((max, item) => Math.max(max, Number(item.totalScore) || 0), 0)
  const overtimeCount = records.filter((item) => item.isOvertime).length
  const lowItemMap = {}
  const markerTypeMap = {}
  const scoreReasonMap = {}
  const overtimeStageMap = {}
  let markerCount = 0

  records.forEach((record) => {
    ;(record.scores || []).forEach((item) => {
      const maxScore = Number(item.maxScore) || 0
      const score = Number(item.score) || 0
      if (maxScore && score / maxScore < 0.75) {
        lowItemMap[item.name] = (lowItemMap[item.name] || 0) + 1
      }
      ;(Array.isArray(item.reasons) ? item.reasons : []).forEach((reason) => {
        scoreReasonMap[reason] = (scoreReasonMap[reason] || 0) + 1
      })
    })

    ;(record.markers || []).forEach((marker) => {
      markerCount += 1
      const type = marker.type || '未分类'
      markerTypeMap[type] = (markerTypeMap[type] || 0) + 1
    })

    ;(record.stageDeviations || []).forEach((stage) => {
      if (Number(stage.deviationSeconds) <= 0) return
      if (!overtimeStageMap[stage.name]) {
        overtimeStageMap[stage.name] = { name: stage.name, count: 0, totalSeconds: 0 }
      }
      overtimeStageMap[stage.name].count += 1
      overtimeStageMap[stage.name].totalSeconds += Number(stage.deviationSeconds) || 0
    })
  })

  const commonLowItems = Object.keys(lowItemMap)
    .map((name) => ({ name, count: lowItemMap[name] }))
    .sort((a, b) => b.count - a.count)

  const commonMarkerTypes = Object.keys(markerTypeMap)
    .map((name) => ({ name, count: markerTypeMap[name] }))
    .sort((a, b) => b.count - a.count)

  const commonScoreReasons = Object.keys(scoreReasonMap)
    .map((name) => ({ name, count: scoreReasonMap[name] }))
    .sort((a, b) => b.count - a.count)

  const commonOvertimeStages = Object.keys(overtimeStageMap)
    .map((name) => overtimeStageMap[name])
    .sort((a, b) => b.count - a.count || b.totalSeconds - a.totalSeconds)

  return {
    count,
    averageScore: count ? Math.round((totalScore / count) * 10) / 10 : 0,
    highestScore,
    averageUsedSeconds: count ? Math.round(totalUsedSeconds / count) : 0,
    overtimeCount,
    markerCount,
    averageMarkerCount: count ? Math.round((markerCount / count) * 10) / 10 : 0,
    recentRecords: records.slice(0, 7),
    commonLowItems,
    commonMarkerTypes,
    commonScoreReasons,
    commonOvertimeStages
  }
}
