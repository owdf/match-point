<template>
  <view class="app-page timer-page">
    <view v-if="template" class="timer-wrap">
      <view class="app-topbar timer-topbar">
        <view class="timer-title">
          <text class="app-title">训练控制台</text>
          <text class="app-subtitle">{{ template.name }}</text>
        </view>
        <button class="fullscreen-entry" @tap="goFullscreen">全屏</button>
      </view>

      <view class="meta-row">
        <text class="app-chip">目标 {{ template.targetMinutes }} 分钟</text>
        <text class="app-chip">总时长 {{ template.totalMinutes }} 分钟</text>
        <text class="app-chip" :class="{ 'app-chip-active': running, 'app-chip-danger': isOvertime }">{{ statusText }}</text>
      </view>

      <view class="timer-hero app-primary-card">
        <text class="hero-label">总剩余时间</text>
        <text class="hero-time">{{ formatMMSSMS(totalRemainingMilliseconds) }}</text>
        <text class="hero-sub">已用 {{ formatDurationWithMs(elapsedMilliseconds) }}</text>
        <view class="hero-progress app-progress">
          <view class="app-progress-inner-gold" :style="{ width: totalProgress + '%' }"></view>
        </view>
        <view class="hero-bottom">
          <text class="hero-stage">{{ currentStage.name || '未记录阶段' }}</text>
          <text class="hero-percent">总进度 {{ totalProgress }}%</text>
        </view>
      </view>

      <view v-if="targetReached && !isOvertime" class="notice target">
        已到达目标完成时间，请准备收尾。
      </view>
      <view v-if="isOvertime" class="notice overtime">
        已超过计划总时长，当前训练处于超时状态。
      </view>

      <view class="stage-card app-surface-card">
        <view class="stage-head">
          <view>
            <text class="section-kicker">当前阶段</text>
            <text class="stage-name">{{ currentStage.name }}</text>
          </view>
          <text class="app-chip">{{ currentStageIndex + 1 }} / {{ template.stages.length }}</text>
        </view>
        <view class="stage-time-grid">
          <view>
            <text class="stage-time-label">阶段剩余</text>
            <text class="stage-time-value">{{ formatMMSSMS(currentStageRemainingMilliseconds) }}</text>
          </view>
          <view>
            <text class="stage-time-label">计划</text>
            <text class="stage-time-value small">{{ currentStage.minutes }}分钟</text>
          </view>
        </view>
        <view class="app-progress stage-progress">
          <view class="app-progress-inner" :style="{ width: currentStageProgress + '%' }"></view>
        </view>
        <text class="stage-progress-text">阶段进度 {{ currentStageProgress }}%</text>
      </view>

      <view class="quick-card app-surface-card">
        <view class="quick-head">
          <text class="section-title">快捷标记</text>
          <text class="quick-note">点击记录当前节点</text>
        </view>
        <view class="quick-list">
          <text
            v-for="type in quickMarkerTypes"
            :key="type"
            class="quick-chip"
            @tap="addQuickMarker(type)"
          >
            {{ type }}
          </text>
        </view>
      </view>

      <view class="action-panel">
        <button class="app-button-secondary mark-action" @tap="openMarkerModal">标记时间</button>
        <button class="app-button-primary main-action" @tap="toggleTimer">{{ primaryButtonText }}</button>
      </view>

      <view class="stage-nav">
        <button class="nav-btn" :class="{ disabled: currentStageIndex === 0 }" @tap="previousStage">上一阶段</button>
        <button class="nav-btn" :class="{ disabled: currentStageIndex === template.stages.length - 1 }" @tap="nextStage">下一阶段</button>
      </view>

      <button class="app-button-danger finish-action" @tap="finishTraining">结束训练</button>

      <view v-if="sortedMarkers.length" class="app-section">
        <view class="app-section-head">
          <text class="app-section-title">本次标记</text>
          <text class="app-section-note">点击可补充原因</text>
        </view>
        <view class="marker-list app-list">
          <view
            v-for="marker in sortedMarkers"
            :key="marker.id"
            class="marker-item app-list-item"
            @tap="editMarker(marker)"
          >
            <text class="marker-time">{{ marker.timeText }}</text>
            <view class="app-row-main">
              <text class="app-row-title">{{ marker.type || '重要节点' }}</text>
              <text class="app-row-desc">{{ marker.note || marker.stageName || '尚未填写原因' }}</text>
            </view>
            <text class="app-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="app-section">
        <view class="app-section-head">
          <text class="app-section-title">阶段安排</text>
        </view>
        <view class="stage-list app-list">
          <view
            v-for="(stage, index) in template.stages"
            :key="stage.id"
            class="stage-row app-list-item"
            :class="{ current: index === currentStageIndex, done: stageUsedSeconds[index] >= minutesToSeconds(stage.minutes) }"
          >
            <text class="stage-dot"></text>
            <view class="app-row-main">
              <text class="app-row-title">{{ stage.name }}</text>
              <text class="app-row-desc">{{ formatMMSSMS(stageUsedMilliseconds[index] || 0) }} / {{ stage.minutes }}分钟</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="showMarkerModal" class="marker-mask" @tap="closeMarkerModal">
        <view class="marker-dialog" @tap.stop>
          <view class="modal-head">
            <text class="modal-title">补充时间标记</text>
            <text class="modal-close" @tap="closeMarkerModal">关闭</text>
          </view>

          <view class="modal-info">
            <view class="modal-info-item">
              <text class="modal-info-label">当前已用</text>
              <text class="modal-info-value">{{ formatDurationWithMs(markerTimeMilliseconds) }}</text>
            </view>
            <view class="modal-info-item">
              <text class="modal-info-label">当前阶段</text>
              <text class="modal-info-value">{{ markerStageName }}</text>
            </view>
          </view>

          <text class="field-label">标记类型</text>
          <view class="type-grid">
            <text
              v-for="type in markerTypes"
              :key="type"
              class="type-option"
              :class="{ selected: markerType === type }"
              @tap="markerType = type"
            >
              {{ type }}
            </text>
          </view>

          <text class="field-label note-label">备注</text>
          <textarea
            class="app-textarea note-input"
            v-model="markerNote"
            placeholder="可填写节点说明、问题现象或处理情况"
            maxlength="120"
          />

          <button class="app-button-primary save-marker-btn" @tap="saveMarker">保存说明</button>
        </view>
      </view>
    </view>

    <view v-else class="app-empty">
      <text class="app-empty-title">未找到训练模板</text>
      <text class="app-empty-desc">请先选择一个训练模板。</text>
      <button class="app-button-primary empty-action" @tap="goTemplate">返回模板选择</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { getCurrentTraining, getTemplateById, saveCurrentTraining } from '../../utils/storage.js'
import { calcStageDeviation } from '../../utils/report.js'
import { formatDuration, formatDurationWithMs, formatMMSSMS, getFormattedDate, minutesToSeconds } from '../../utils/time.js'

const markerTypes = ['阶段完成', '重要节点', '出现问题', '设备异常', '表达卡顿', '自定义']
const quickMarkerTypes = ['讲解开始', '讲解结束', '演示开始', '演示结束', '设备异常', '表达卡顿', '超时风险']

const template = ref(null)
const recordId = ref(createRecordId())
const currentStageIndex = ref(0)
const elapsedMilliseconds = ref(0)
const stageUsedMilliseconds = ref([])
const markers = ref([])
const running = ref(false)
const started = ref(false)
const startedAt = ref('')
const targetReached = ref(false)
const showMarkerModal = ref(false)
const markerType = ref(markerTypes[0])
const markerNote = ref('')
const markerTimeMilliseconds = ref(0)
const markerStageName = ref('')
const editingMarkerId = ref('')
const timerBaseTimestamp = ref(0)
const elapsedBaseMilliseconds = ref(0)
const stageBaseMilliseconds = ref([])
let timer = null
let lastPersistAt = 0
let trainingFinished = false
let enteringFullscreen = false

const totalSeconds = computed(() => minutesToSeconds(template.value ? template.value.totalMinutes : 0))
const targetSeconds = computed(() => minutesToSeconds(template.value ? template.value.targetMinutes : 0))
const totalMilliseconds = computed(() => totalSeconds.value * 1000)
const targetMilliseconds = computed(() => targetSeconds.value * 1000)
const elapsedSeconds = computed(() => Math.floor(elapsedMilliseconds.value / 1000))
const stageUsedSeconds = computed(() => stageUsedMilliseconds.value.map((item) => Math.floor((Number(item) || 0) / 1000)))
const totalRemainingMilliseconds = computed(() => Math.max(0, totalMilliseconds.value - elapsedMilliseconds.value))
const isOvertime = computed(() => elapsedMilliseconds.value > totalMilliseconds.value)
const sortedMarkers = computed(() => sortMarkers(markers.value))

const currentStage = computed(() => {
  if (!template.value) return { name: '', minutes: 0 }
  return template.value.stages[currentStageIndex.value] || template.value.stages[0]
})

const currentStagePlanSeconds = computed(() => minutesToSeconds(currentStage.value.minutes))
const currentStagePlanMilliseconds = computed(() => currentStagePlanSeconds.value * 1000)
const currentStageUsedMilliseconds = computed(() => stageUsedMilliseconds.value[currentStageIndex.value] || 0)
const currentStageRemainingMilliseconds = computed(() => Math.max(0, currentStagePlanMilliseconds.value - currentStageUsedMilliseconds.value))

const totalProgress = computed(() => {
  if (!totalMilliseconds.value) return 0
  return Math.min(100, Math.round((elapsedMilliseconds.value / totalMilliseconds.value) * 100))
})

const currentStageProgress = computed(() => {
  if (!currentStagePlanMilliseconds.value) return 0
  const used = stageUsedMilliseconds.value[currentStageIndex.value] || 0
  return Math.min(100, Math.round((used / currentStagePlanMilliseconds.value) * 100))
})

const statusText = computed(() => {
  if (isOvertime.value) return '已超时'
  if (running.value) return '训练中'
  if (started.value) return '已暂停'
  return '未开始'
})

const primaryButtonText = computed(() => {
  if (running.value) return '暂停'
  if (started.value) return '继续'
  return '开始'
})

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function createRecordId() {
  return `record-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createMarkerId() {
  return `marker_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function getMarkerMilliseconds(marker) {
  if (!marker) return 0
  const exact = Number(marker.timeMilliseconds)
  if (!Number.isNaN(exact) && exact > 0) return exact
  return Math.max(0, Math.floor((Number(marker.timeSeconds) || 0) * 1000))
}

function sortMarkers(list) {
  return [...list].sort((a, b) => {
    const timeDiff = getMarkerMilliseconds(a) - getMarkerMilliseconds(b)
    if (timeDiff !== 0) return timeDiff
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  })
}

function getSavedTimestamp(training) {
  const value = Date.parse(training.lastSavedAt || training.createdAt || training.startedAt || '')
  return Number.isNaN(value) ? 0 : value
}

function resetTimerBase(timestamp = Date.now()) {
  timerBaseTimestamp.value = timestamp
  elapsedBaseMilliseconds.value = elapsedMilliseconds.value
  stageBaseMilliseconds.value = [...stageUsedMilliseconds.value]
}

function syncElapsed(timestamp = Date.now()) {
  if (!running.value) return
  const delta = Math.max(0, timestamp - timerBaseTimestamp.value)
  elapsedMilliseconds.value = elapsedBaseMilliseconds.value + delta
  stageUsedMilliseconds.value[currentStageIndex.value] = (stageBaseMilliseconds.value[currentStageIndex.value] || 0) + delta

  if (!targetReached.value && elapsedMilliseconds.value >= targetMilliseconds.value) {
    targetReached.value = true
    uni.showToast({ title: '已到目标完成时间', icon: 'none' })
  }

  persistTimerDraft()
}

function createCurrentMarker(type, note = '') {
  syncElapsed()
  const timeMilliseconds = elapsedMilliseconds.value
  const timeSeconds = Math.floor(timeMilliseconds / 1000)
  return {
    id: createMarkerId(),
    timeSeconds,
    timeMilliseconds,
    timeText: formatDuration(timeSeconds),
    stageName: currentStage.value.name,
    type,
    note,
    createdAt: new Date().toISOString()
  }
}

function buildTrainingRecord(endedAt = '') {
  const now = new Date().toISOString()
  const recordTime = endedAt || now
  const stages = template.value.stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    minutes: Number(stage.minutes) || 0,
    plannedSeconds: minutesToSeconds(stage.minutes),
    usedSeconds: stageUsedSeconds.value[index] || 0,
    usedMilliseconds: stageUsedMilliseconds.value[index] || 0
  }))

  return {
    id: recordId.value,
    templateId: template.value.id,
    templateName: template.value.name,
    startedAt: startedAt.value || recordTime,
    endedAt,
    totalSeconds: totalSeconds.value,
    targetSeconds: targetSeconds.value,
    usedSeconds: elapsedSeconds.value,
    usedMilliseconds: elapsedMilliseconds.value,
    currentStageIndex: currentStageIndex.value,
    started: started.value,
    running: running.value,
    isOvertime: elapsedMilliseconds.value > totalMilliseconds.value,
    stages,
    checklist: clone(template.value.checklist || []).map((item) => ({ ...item, checked: false })),
    scores: clone(template.value.scoreItems || []).map((item) => ({ ...item, score: 0, reasons: Array.isArray(item.reasons) ? item.reasons : [] })),
    markers: sortMarkers(clone(markers.value)),
    stageDeviations: calcStageDeviation(stages),
    totalScore: 0,
    level: '',
    notes: '',
    nextPlan: '',
    report: '',
    reportImagePath: '',
    createdAt: recordTime,
    lastSavedAt: recordTime,
    displayDate: getFormattedDate(recordTime)
  }
}

function persistTimerDraft(force = false) {
  if (!template.value) return
  if (!started.value && elapsedMilliseconds.value <= 0 && !markers.value.length) return
  const now = Date.now()
  if (!force && now - lastPersistAt < 1000) return
  lastPersistAt = now
  saveCurrentTraining(buildTrainingRecord())
}

function startInterval() {
  clearInterval(timer)
  resetTimerBase()
  timer = setInterval(() => {
    syncElapsed()
  }, 37)
}

function toggleTimer() {
  if (!template.value) return
  if (running.value) {
    syncElapsed()
    running.value = false
    clearInterval(timer)
    persistTimerDraft(true)
    return
  }
  if (!started.value) {
    started.value = true
    startedAt.value = new Date().toISOString()
  }
  running.value = true
  startInterval()
  persistTimerDraft(true)
}

function previousStage() {
  if (currentStageIndex.value <= 0) return
  syncElapsed()
  currentStageIndex.value -= 1
  if (running.value) resetTimerBase()
  persistTimerDraft(true)
}

function nextStage() {
  if (!template.value || currentStageIndex.value >= template.value.stages.length - 1) return
  syncElapsed()
  currentStageIndex.value += 1
  if (running.value) resetTimerBase()
  persistTimerDraft(true)
}

function openMarkerModal() {
  if (!template.value) return
  const marker = createCurrentMarker(markerTypes[1] || markerTypes[0])
  markers.value = sortMarkers([...markers.value, marker])
  persistTimerDraft(true)
  editMarker(marker)
  uni.showToast({ title: '已标记当前时间', icon: 'success' })
}

function addQuickMarker(type) {
  if (!template.value) return
  const marker = createCurrentMarker(type)
  markers.value = sortMarkers([...markers.value, marker])
  persistTimerDraft(true)
  uni.showToast({ title: '已标记当前时间', icon: 'success' })
}

function editMarker(marker) {
  if (!marker) return
  editingMarkerId.value = marker.id
  markerTimeMilliseconds.value = getMarkerMilliseconds(marker)
  markerStageName.value = marker.stageName || ''
  markerType.value = marker.type || markerTypes[1] || markerTypes[0]
  markerNote.value = marker.note || ''
  showMarkerModal.value = true
}

function closeMarkerModal() {
  showMarkerModal.value = false
}

function saveMarker() {
  if (!template.value) return
  const markerIndex = markers.value.findIndex((item) => item.id === editingMarkerId.value)
  if (markerIndex < 0) {
    showMarkerModal.value = false
    return
  }
  const current = markers.value[markerIndex]
  const nextMarker = {
    ...current,
    type: markerType.value,
    note: String(markerNote.value || '').trim(),
    timeText: current.timeText || formatDurationWithMs(getMarkerMilliseconds(current))
  }
  const nextMarkers = [...markers.value]
  nextMarkers.splice(markerIndex, 1, nextMarker)
  markers.value = sortMarkers(nextMarkers)
  persistTimerDraft(true)
  showMarkerModal.value = false
  uni.showToast({ title: '标记已更新', icon: 'success' })
}

function finishTraining() {
  if (!template.value) return
  syncElapsed()
  clearInterval(timer)
  running.value = false
  trainingFinished = true
  const now = new Date().toISOString()
  saveCurrentTraining(buildTrainingRecord(now))
  uni.navigateTo({ url: '/pages/training/checklist' })
}

function goFullscreen() {
  if (!template.value) return
  syncElapsed()
  saveCurrentTraining(buildTrainingRecord())
  enteringFullscreen = true
  clearInterval(timer)
  uni.navigateTo({ url: '/pages/training/fullscreen' })
}

function goTemplate() {
  uni.switchTab({ url: '/pages/template/list' })
}

onLoad((query) => {
  const id = query.templateId ? decodeURIComponent(query.templateId) : ''
  const found = id ? getTemplateById(id) : null
  if (found) {
    template.value = found
    if (!restoreTrainingDraft(found)) {
      stageUsedMilliseconds.value = found.stages.map(() => 0)
      stageBaseMilliseconds.value = found.stages.map(() => 0)
    }
  }
})

function restoreTrainingDraft(found, showToast = true) {
  const current = getCurrentTraining()
  if (!current || current.templateId !== found.id || current.endedAt) return false

  const savedStages = Array.isArray(current.stages) ? current.stages : []
  recordId.value = current.id || createRecordId()
  currentStageIndex.value = Math.min(
    Math.max(Number(current.currentStageIndex) || 0, 0),
    Math.max(0, found.stages.length - 1)
  )
  elapsedMilliseconds.value = Math.max(
    0,
    Math.floor(Number(current.usedMilliseconds) || (Number(current.usedSeconds) || 0) * 1000)
  )
  stageUsedMilliseconds.value = found.stages.map((stage, index) => {
    const savedStage = savedStages.find((item) => item.id === stage.id) || savedStages[index] || {}
    return Math.max(
      0,
      Math.floor(Number(savedStage.usedMilliseconds) || (Number(savedStage.usedSeconds) || 0) * 1000)
    )
  })

  if (current.running) {
    const savedAt = getSavedTimestamp(current)
    const awayMilliseconds = savedAt ? Math.max(0, Date.now() - savedAt) : 0
    if (awayMilliseconds) {
      elapsedMilliseconds.value += awayMilliseconds
      stageUsedMilliseconds.value[currentStageIndex.value] = (stageUsedMilliseconds.value[currentStageIndex.value] || 0) + awayMilliseconds
    }
  }

  stageBaseMilliseconds.value = [...stageUsedMilliseconds.value]
  markers.value = sortMarkers(
    (Array.isArray(current.markers) ? current.markers : []).map((marker) => ({
      ...marker,
      timeMilliseconds: getMarkerMilliseconds(marker),
      timeText: marker.timeText || formatDurationWithMs(getMarkerMilliseconds(marker)),
      note: marker.note || ''
    }))
  )
  startedAt.value = current.startedAt || ''
  started.value = Boolean(current.startedAt) || elapsedMilliseconds.value > 0
  running.value = Boolean(current.running)
  targetReached.value = Boolean(targetMilliseconds.value && elapsedMilliseconds.value >= targetMilliseconds.value)
  resetTimerBase()
  if (running.value) startInterval()
  if (showToast) uni.showToast({ title: '已恢复上次训练进度', icon: 'none' })
  return true
}

onShow(() => {
  if (!template.value || trainingFinished) return
  enteringFullscreen = false
  restoreTrainingDraft(template.value, false)
})

onHide(() => {
  if (trainingFinished) return
  syncElapsed()
  persistTimerDraft(true)
  if (enteringFullscreen) clearInterval(timer)
})

onUnload(() => {
  if (trainingFinished) {
    clearInterval(timer)
    return
  }
  syncElapsed()
  persistTimerDraft(true)
  clearInterval(timer)
})
</script>

<style scoped>
.timer-page {
  padding-bottom: 72rpx;
}

.timer-topbar {
  margin-bottom: 18rpx;
}

.timer-title {
  flex: 1;
  min-width: 0;
}

.fullscreen-entry {
  width: 112rpx;
  height: 58rpx;
  line-height: 58rpx;
  border-radius: 999rpx;
  background: #e6f0ed;
  color: #073f3f;
  font-size: 24rpx;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 22rpx;
}

.timer-hero {
  margin-top: 8rpx;
}

.hero-label {
  display: block;
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.72);
}

.hero-time {
  display: block;
  margin-top: 22rpx;
  font-size: 80rpx;
  line-height: 1;
  font-weight: 850;
  letter-spacing: 0;
  white-space: nowrap;
  color: #ffffff;
}

.hero-sub {
  display: block;
  margin-top: 16rpx;
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.76);
}

.hero-progress {
  margin-top: 30rpx;
  background: rgba(255, 255, 255, 0.22);
}

.hero-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 18rpx;
}

.hero-stage,
.hero-percent {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.82);
}

.hero-stage {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}

.notice {
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  font-size: 25rpx;
  line-height: 1.45;
}

.notice.target {
  background: #e6f0ed;
  color: #073f3f;
}

.notice.overtime {
  background: #fee2e2;
  color: #dc2626;
}

.stage-card,
.quick-card {
  margin-top: 24rpx;
}

.stage-head,
.quick-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-kicker,
.quick-note {
  display: block;
  font-size: 23rpx;
  color: #64706d;
}

.section-title {
  display: block;
  font-size: 29rpx;
  font-weight: 720;
  color: #172121;
}

.stage-name {
  display: block;
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.25;
  font-weight: 780;
  color: #172121;
}

.stage-time-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 16rpx;
  margin-top: 28rpx;
}

.stage-time-label {
  display: block;
  font-size: 23rpx;
  color: #64706d;
}

.stage-time-value {
  display: block;
  margin-top: 8rpx;
  font-size: 42rpx;
  line-height: 1.1;
  font-weight: 780;
  color: #073f3f;
  white-space: nowrap;
}

.stage-time-value.small {
  font-size: 32rpx;
}

.stage-progress {
  margin-top: 28rpx;
}

.stage-progress-text {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #64706d;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.quick-chip {
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #e6f0ed;
  color: #073f3f;
  font-size: 23rpx;
  font-weight: 650;
}

.action-panel {
  display: flex;
  gap: 16rpx;
  margin-top: 26rpx;
}

.mark-action {
  width: 220rpx;
}

.main-action {
  flex: 1;
}

.stage-nav {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.nav-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #e4ded0;
  color: #073f3f;
  font-size: 25rpx;
}

.nav-btn.disabled {
  color: #9aa3a0;
}

.finish-action {
  width: 100%;
  margin-top: 16rpx;
}

.marker-time {
  width: 132rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 760;
  color: #0f5c5c;
}

.stage-row {
  justify-content: flex-start;
}

.stage-dot {
  width: 16rpx;
  height: 16rpx;
  margin-right: 18rpx;
  border-radius: 50%;
  background: #d6cbb8;
}

.stage-row.current .stage-dot {
  background: #0f5c5c;
}

.stage-row.done .stage-dot {
  background: #c99a2e;
}

.marker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 99;
  padding: 0 34rpx;
  background: rgba(23, 33, 33, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-dialog {
  width: 100%;
  padding: 30rpx;
  border-radius: 34rpx;
  background: #ffffff;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 760;
  color: #172121;
}

.modal-close {
  font-size: 25rpx;
  color: #64706d;
}

.modal-info {
  display: flex;
  gap: 16rpx;
  margin-bottom: 26rpx;
}

.modal-info-item {
  flex: 1;
  min-width: 0;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #fbfaf4;
}

.modal-info-label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: #64706d;
}

.modal-info-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 28rpx;
  font-weight: 700;
  color: #172121;
}

.field-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 25rpx;
  font-weight: 700;
  color: #172121;
}

.note-label {
  margin-top: 26rpx;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.type-option {
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #fbfaf4;
  border: 1rpx solid #e4ded0;
  color: #64706d;
  font-size: 23rpx;
}

.type-option.selected {
  border-color: #0f5c5c;
  background: #e6f0ed;
  color: #073f3f;
  font-weight: 700;
}

.note-input {
  min-height: 160rpx;
}

.save-marker-btn {
  width: 100%;
  margin-top: 28rpx;
}

.empty-action {
  width: 320rpx;
  margin: 32rpx auto 0;
}
</style>
