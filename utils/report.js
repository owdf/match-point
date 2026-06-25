import {
  calcTimeDiff,
  formatDuration,
  formatDurationLabel,
  formatDurationWithMs,
  getFormattedDate,
  minutesToSeconds
} from './time.js'

export const SCORE_REASON_OPTIONS = {
  时间控制: ['前期准备过长', '技术说明过长', '演示环节拖延', '总结收尾不足', '超出目标时间'],
  技术说明: ['逻辑不够清晰', '关键原理说明不足', '专业术语使用不准确', '系统架构说明不完整', '重点不突出'],
  系统演示: ['功能展示不完整', '操作步骤不流畅', '设备运行不稳定', '演示顺序不合理', '关键亮点未展示'],
  操作规范: ['操作流程不规范', '检查步骤遗漏', '现场整理不足', '安全意识不足'],
  表达流畅度: ['语速不稳定', '停顿过多', '表达重复', '重点不明确', '临场应变不足'],
  现场稳定性: ['程序卡顿', '设备异常', '连接不稳定', '备用方案不足', '问题处理不及时'],
  创新展示: ['创新点说明不足', '应用价值不明确', '与同类方案区别不明显', '展示深度不足']
}

export function getScoreLevel(totalScore) {
  const score = Number(totalScore) || 0
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '合格'
  return '需改进'
}

export function getScoreReasonOptions(scoreName) {
  return SCORE_REASON_OPTIONS[scoreName] || ['内容准备不足', '现场执行不稳定', '表达不够清晰']
}

export function getLowScoreItems(scores = []) {
  return (Array.isArray(scores) ? scores : [])
    .filter((item) => {
      const maxScore = Number(item.maxScore) || 0
      if (!maxScore) return false
      return (Number(item.score) || 0) / maxScore < 0.75
    })
    .sort((a, b) => {
      const aRate = (Number(a.score) || 0) / (Number(a.maxScore) || 1)
      const bRate = (Number(b.score) || 0) / (Number(b.maxScore) || 1)
      return aRate - bRate
    })
}

export function getSortedMarkers(markers = []) {
  const source = Array.isArray(markers) ? markers : []
  return [...source]
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => {
      const aTime = Number(a.timeMilliseconds) || (Number(a.timeSeconds) || 0) * 1000
      const bTime = Number(b.timeMilliseconds) || (Number(b.timeSeconds) || 0) * 1000
      if (aTime !== bTime) return aTime - bTime
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    })
}

function getMarkerSeconds(marker = {}) {
  const seconds = Number(marker.timeSeconds)
  if (!Number.isNaN(seconds) && seconds >= 0) return Math.floor(seconds)

  const milliseconds = Number(marker.timeMilliseconds)
  if (!Number.isNaN(milliseconds) && milliseconds >= 0) return Math.floor(milliseconds / 1000)

  return 0
}

export function getMarkerNodeName(marker = {}) {
  const note = String(marker.note || '').trim()
  if (note) return note
  const type = String(marker.type || '').trim()
  if (type) return type
  const stageName = String(marker.stageName || '').trim()
  if (stageName) return stageName
  return '未命名标记'
}

export function getMarkerIntervals(markers = []) {
  const sortedMarkers = getSortedMarkers(markers)
  if (sortedMarkers.length < 2) return []

  const intervals = sortedMarkers.slice(1).map((endMarker, index) => {
    const startMarker = sortedMarkers[index]
    const startSeconds = getMarkerSeconds(startMarker)
    const endSeconds = getMarkerSeconds(endMarker)
    const diff = calcTimeDiff(startSeconds, endSeconds)

    if (!diff.ok) return null

    return {
      id: `${startMarker.id || index}-${endMarker.id || index + 1}`,
      startMarker,
      endMarker,
      startSeconds,
      endSeconds,
      startTimeText: formatDuration(startSeconds),
      endTimeText: formatDuration(endSeconds),
      startName: getMarkerNodeName(startMarker),
      endName: getMarkerNodeName(endMarker),
      durationSeconds: diff.totalSeconds,
      durationText: formatDuration(diff.totalSeconds),
      isLongest: false
    }
  }).filter(Boolean)

  if (!intervals.length) return []

  const longestIndex = intervals.reduce((currentIndex, item, index) => {
    return item.durationSeconds > intervals[currentIndex].durationSeconds ? index : currentIndex
  }, 0)

  return intervals.map((item, index) => ({
    ...item,
    isLongest: index === longestIndex
  }))
}

function hasStageActualSeconds(stage = {}) {
  return stage.usedSeconds !== undefined || stage.usedMilliseconds !== undefined
}

function getStageActualSeconds(stage = {}) {
  if (stage.usedMilliseconds !== undefined) {
    return Math.max(0, Math.floor((Number(stage.usedMilliseconds) || 0) / 1000))
  }
  return Math.max(0, Math.floor(Number(stage.usedSeconds) || 0))
}

function getStagePlanSeconds(stage = {}) {
  const plannedSeconds = Number(stage.plannedSeconds)
  if (!Number.isNaN(plannedSeconds) && plannedSeconds > 0) return Math.floor(plannedSeconds)
  return minutesToSeconds(stage.minutes || 0)
}

export function calcStageDeviation(stages = []) {
  const source = Array.isArray(stages) ? stages : []
  return source
    .filter((stage) => stage && typeof stage === 'object' && hasStageActualSeconds(stage))
    .map((stage, index) => {
      const plannedSeconds = getStagePlanSeconds(stage)
      const actualSeconds = getStageActualSeconds(stage)
      const deviationSeconds = actualSeconds - plannedSeconds
      return {
        id: stage.id || `stage-deviation-${index + 1}`,
        name: stage.name || `阶段${index + 1}`,
        plannedSeconds,
        actualSeconds,
        deviationSeconds,
        plannedText: formatDuration(plannedSeconds),
        actualText: formatDuration(actualSeconds),
        deviationText: formatDuration(Math.abs(deviationSeconds)),
        resultText: formatDurationLabel(deviationSeconds)
      }
    })
}

export function findMaxOvertimeStage(stageDeviations = []) {
  const source = Array.isArray(stageDeviations) ? stageDeviations : []
  const overtimeStages = source.filter((item) => Number(item.deviationSeconds) > 0)
  if (!overtimeStages.length) return null
  return overtimeStages.reduce((max, item) => {
    return Number(item.deviationSeconds) > Number(max.deviationSeconds) ? item : max
  }, overtimeStages[0])
}

export function getRecordStageDeviations(record = {}) {
  if (Array.isArray(record.stageDeviations) && record.stageDeviations.length) {
    return record.stageDeviations.map((item, index) => {
      const plannedSeconds = Math.max(0, Math.floor(Number(item.plannedSeconds) || 0))
      const actualSeconds = Math.max(0, Math.floor(Number(item.actualSeconds) || 0))
      const deviationSeconds = Number(item.deviationSeconds)
      const safeDeviation = Number.isNaN(deviationSeconds) ? actualSeconds - plannedSeconds : Math.floor(deviationSeconds)
      return {
        id: item.id || `stage-deviation-${index + 1}`,
        name: item.name || `阶段${index + 1}`,
        plannedSeconds,
        actualSeconds,
        deviationSeconds: safeDeviation,
        plannedText: item.plannedText || formatDuration(plannedSeconds),
        actualText: item.actualText || formatDuration(actualSeconds),
        deviationText: item.deviationText || formatDuration(Math.abs(safeDeviation)),
        resultText: item.resultText || formatDurationLabel(safeDeviation)
      }
    })
  }
  return calcStageDeviation(record.stages || [])
}

function getMarkerTimeText(marker) {
  if (marker.timeText) return marker.timeText
  if (marker.timeMilliseconds) return formatDurationWithMs(Number(marker.timeMilliseconds) || 0)
  return marker.timeText || formatDuration(Number(marker.timeSeconds) || 0)
}

function generateMarkerReport(markers = []) {
  const sortedMarkers = getSortedMarkers(markers)
  if (!sortedMarkers.length) return ''

  const lines = sortedMarkers.map((marker) => {
    const timeText = getMarkerTimeText(marker)
    const stageText = marker.stageName ? `${marker.stageName}阶段` : '未记录阶段'
    const type = marker.type || '未分类'
    const note = marker.note ? `，备注：${marker.note}` : ''
    return `- ${timeText}，${stageText}，标记为“${type}”${note}。`
  })

  return [`本次训练共记录${sortedMarkers.length}个时间标记：`, ...lines].join('\n')
}

function generateMarkerIntervalReport(markers = []) {
  const sortedMarkers = getSortedMarkers(markers)
  if (sortedMarkers.length < 2) return ''

  const longestInterval = getMarkerIntervals(sortedMarkers).find((item) => item.isLongest)
  if (!longestInterval) return ''

  return `本次训练共记录 ${sortedMarkers.length} 个时间标记。其中最长标记区间为“${longestInterval.startName}”到“${longestInterval.endName}”，用时 ${longestInterval.durationText}。建议复盘该区间内容安排，判断是否存在说明过长或转换不够紧凑的问题。`
}

function generateStageDeviationReport(record = {}) {
  const stageDeviations = getRecordStageDeviations(record)
  if (!stageDeviations.length) return ''

  const maxOvertimeStage = findMaxOvertimeStage(stageDeviations)
  const overtimeCount = stageDeviations.filter((item) => item.deviationSeconds > 0).length
  const savedCount = stageDeviations.filter((item) => item.deviationSeconds < 0).length

  if (maxOvertimeStage) {
    return `阶段偏差：本次训练共统计 ${stageDeviations.length} 个阶段，其中 ${overtimeCount} 个阶段超出计划、${savedCount} 个阶段节省时间。超出最多的是“${maxOvertimeStage.name}”，计划 ${maxOvertimeStage.plannedText}，实际 ${maxOvertimeStage.actualText}，超出 ${maxOvertimeStage.deviationText}，建议重点复盘该阶段的内容密度与衔接安排。`
  }

  return `阶段偏差：本次训练共统计 ${stageDeviations.length} 个阶段，未发现阶段实际用时超出计划的情况，可继续保持当前节奏控制方式。`
}

export function getScoreReasonSummary(scores = []) {
  const reasonMap = {}
  ;(Array.isArray(scores) ? scores : []).forEach((item) => {
    ;(Array.isArray(item.reasons) ? item.reasons : []).forEach((reason) => {
      if (!reason) return
      reasonMap[reason] = (reasonMap[reason] || 0) + 1
    })
  })
  return Object.keys(reasonMap)
    .map((name) => ({ name, count: reasonMap[name] }))
    .sort((a, b) => b.count - a.count)
}

function generateScoreReasonReport(scores = []) {
  const reasons = getScoreReasonSummary(scores)
  if (!reasons.length) return ''

  const topReasons = reasons.slice(0, 4).map((item) => item.name).join('、')
  return `扣分原因：本次自评记录的主要扣分原因包括${topReasons}，后续复练可围绕这些问题做针对性调整。`
}

export function getImprovementAdvice(record = {}) {
  const advice = []
  const scores = record.scores || []
  const lowItems = getLowScoreItems(scores)
  const scoreReasons = getScoreReasonSummary(scores)
  const maxOvertimeStage = findMaxOvertimeStage(getRecordStageDeviations(record))

  if (record.isOvertime) {
    advice.push('后续训练应提前压缩说明环节，保留关键演示时间，减少临场犹豫。')
  }

  if (maxOvertimeStage) {
    advice.push(`建议重点复盘“${maxOvertimeStage.name}”阶段，将超出的 ${maxOvertimeStage.deviationText} 拆分到具体讲解、演示或转场动作中。`)
  }

  scoreReasons.slice(0, 2).forEach((item) => {
    advice.push(`建议针对“${item.name}”设置下次训练检查点，复练后再对比评分变化。`)
  })

  lowItems.slice(0, 3).forEach((item) => {
    if (item.name.includes('时间')) {
      advice.push('建议按阶段设置提醒点，训练中及时调整节奏。')
    } else if (item.name.includes('技术')) {
      advice.push('建议把技术说明拆成结构、流程、关键参数三部分，减少跳跃表达。')
    } else if (item.name.includes('演示')) {
      advice.push('建议提前固定演示路径，重点检查易卡顿步骤。')
    } else if (item.name.includes('操作')) {
      advice.push('建议按照比赛规范整理操作顺序，形成稳定的动作流程。')
    } else if (item.name.includes('表达')) {
      advice.push('建议训练开场、转场和总结话术，提高表达连贯性。')
    } else if (item.name.includes('稳定')) {
      advice.push('建议记录设备异常和处理方式，准备必要的备用方案。')
    } else {
      advice.push(`建议针对“${item.name}”安排专项复练，并记录每次改进情况。`)
    }
  })

  if (!advice.length) {
    advice.push('本次训练整体完成度较好，后续可继续提升表达精炼度和关键环节稳定性。')
  }

  return Array.from(new Set(advice))
}

export function getReportExportSummary(record = {}) {
  const lowItems = getLowScoreItems(record.scores || [])
  const markerInterval = getMarkerIntervals(record.markers || []).find((item) => item.isLongest)
  const maxOvertimeStage = findMaxOvertimeStage(getRecordStageDeviations(record))
  const reasonSummary = getScoreReasonSummary(record.scores || [])

  return {
    dateText: record.startedAt ? getFormattedDate(record.startedAt) : getFormattedDate(record.createdAt),
    templateName: record.templateName || '未命名模板',
    usedText: formatDuration(record.usedSeconds || record.totalSeconds || 0),
    overtimeText: record.isOvertime ? '已超时' : '未超时',
    totalScore: Number(record.totalScore) || 0,
    level: record.level || getScoreLevel(record.totalScore),
    lowText: lowItems.length ? lowItems.slice(0, 3).map((item) => item.name).join('、') : '暂无明显低分项',
    markerIntervalText: markerInterval
      ? `${markerInterval.startName} 到 ${markerInterval.endName}，用时 ${markerInterval.durationText}`
      : '暂无可分析的标记区间',
    stageDeviationText: maxOvertimeStage
      ? `${maxOvertimeStage.name}超出${maxOvertimeStage.deviationText}`
      : '暂无明显超出计划阶段',
    reasonText: reasonSummary.length ? reasonSummary.slice(0, 3).map((item) => item.name).join('、') : '暂无记录',
    nextPlan: String(record.nextPlan || '').trim() || '暂未填写'
  }
}

export function generateTrainingReport(record = {}) {
  const lowItems = getLowScoreItems(record.scores || [])
  const advice = getImprovementAdvice(record)
  const dateText = record.startedAt ? getFormattedDate(record.startedAt) : getFormattedDate(record.createdAt)
  const usedText = formatDuration(record.usedSeconds || record.totalSeconds || 0)
  const overtimeText = record.isOvertime ? '已超出计划总时长' : '未超出计划总时长'
  const markerIntervalReport = generateMarkerIntervalReport(record.markers || [])
  const stageDeviationReport = generateStageDeviationReport(record)
  const scoreReasonReport = generateScoreReasonReport(record.scores || [])
  const nextPlanText = String(record.nextPlan || '').trim()
  const lowText = lowItems.length
    ? lowItems.map((item) => `${item.name}${Number(item.score) || 0}/${Number(item.maxScore) || 0}分`).join('、')
    : '暂无明显低分项'

  return [
    `训练日期：${dateText}`,
    `训练模板：${record.templateName || '未命名模板'}`,
    `总用时：${usedText}，${overtimeText}。`,
    `自评结果：总分${Number(record.totalScore) || 0}分，等级为${record.level || getScoreLevel(record.totalScore)}。`,
    markerIntervalReport,
    stageDeviationReport,
    scoreReasonReport,
    `低分项：${lowText}。`,
    '复盘结论：本次训练已完成主要流程，建议继续围绕时间控制、演示稳定性和表达结构进行复练。',
    `改进建议：${advice.join('')}`,
    nextPlanText ? `下次改进计划：${nextPlanText}` : '',
    record.notes ? `个人备注：${record.notes}` : ''
  ].filter(Boolean).join('\n')
}
