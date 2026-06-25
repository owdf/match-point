<template>
  <view class="page">
    <view v-if="training" class="fullscreen-wrap">
      <view class="top-row">
        <view>
          <text class="label">当前阶段</text>
          <text class="stage-name">{{ currentStage.name || '未记录阶段' }}</text>
        </view>
        <text class="status" :class="{ active: running, overtime: isOvertime }">{{ statusText }}</text>
      </view>

      <view class="time-card">
        <text class="time-label">总剩余时间</text>
        <text class="main-time">{{ formatMMSSMS(totalRemainingMilliseconds) }}</text>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: totalProgress + '%' }"></view>
        </view>
        <text class="progress-text">总进度 {{ totalProgress }}%</text>
      </view>

      <view class="stage-card">
        <text class="time-label">当前阶段剩余</text>
        <text class="stage-time">{{ formatMMSSMS(stageRemainingMilliseconds) }}</text>
        <text class="stage-meta">已用 {{ formatMMSSMS(currentStageUsedMilliseconds) }} · 计划 {{ currentStage.minutes || 0 }} 分钟</text>
      </view>

      <view class="control-row">
        <button class="secondary-btn" @tap="addMarker">标记</button>
        <button class="primary-btn" @tap="toggleTimer">{{ primaryButtonText }}</button>
      </view>

      <button class="exit-btn" @tap="exitFullscreen">退出全屏</button>
    </view>

    <view v-else class="empty">
      <text class="empty-title">暂无进行中的训练</text>
      <button class="primary-btn single" @tap="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app'
import { getCurrentTraining, saveCurrentTraining } from '../../utils/storage.js'
import { calcStageDeviation } from '../../utils/report.js'
import { formatDuration, formatMMSSMS, minutesToSeconds } from '../../utils/time.js'

const training = ref(null)
const elapsedMilliseconds = ref(0)
const stageUsedMilliseconds = ref([])
const currentStageIndex = ref(0)
const running = ref(false)
const started = ref(false)
const startedAt = ref('')
const timerBaseTimestamp = ref(0)
const elapsedBaseMilliseconds = ref(0)
const stageBaseMilliseconds = ref([])
let timer = null
let lastPersistAt = 0

const totalSeconds = computed(() => Number(training.value?.totalSeconds) || 0)
const totalMilliseconds = computed(() => totalSeconds.value * 1000)
const elapsedSeconds = computed(() => Math.floor(elapsedMilliseconds.value / 1000))
const stages = computed(() => training.value?.stages || [])
const currentStage = computed(() => stages.value[currentStageIndex.value] || { name: '', minutes: 0 })
const currentStagePlanMilliseconds = computed(() => minutesToSeconds(currentStage.value.minutes || 0) * 1000)
const currentStageUsedMilliseconds = computed(() => stageUsedMilliseconds.value[currentStageIndex.value] || 0)
const totalRemainingMilliseconds = computed(() => Math.max(0, totalMilliseconds.value - elapsedMilliseconds.value))
const stageRemainingMilliseconds = computed(() => Math.max(0, currentStagePlanMilliseconds.value - currentStageUsedMilliseconds.value))
const isOvertime = computed(() => elapsedMilliseconds.value > totalMilliseconds.value)

const totalProgress = computed(() => {
  if (!totalMilliseconds.value) return 0
  return Math.min(100, Math.round((elapsedMilliseconds.value / totalMilliseconds.value) * 100))
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

function getSavedTimestamp(record) {
  const value = Date.parse(record.lastSavedAt || record.createdAt || record.startedAt || '')
  return Number.isNaN(value) ? 0 : value
}

function createMarkerId() {
  return `marker_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function resetTimerBase(timestamp = Date.now()) {
  timerBaseTimestamp.value = timestamp
  elapsedBaseMilliseconds.value = elapsedMilliseconds.value
  stageBaseMilliseconds.value = [...stageUsedMilliseconds.value]
}

function buildTrainingRecord() {
  if (!training.value) return null
  const now = new Date().toISOString()
  const nextStages = stages.value.map((stage, index) => ({
    ...stage,
    plannedSeconds: stage.plannedSeconds || minutesToSeconds(stage.minutes || 0),
    usedSeconds: Math.floor((stageUsedMilliseconds.value[index] || 0) / 1000),
    usedMilliseconds: stageUsedMilliseconds.value[index] || 0
  }))

  return {
    ...clone(training.value),
    startedAt: startedAt.value || training.value.startedAt || now,
    usedSeconds: elapsedSeconds.value,
    usedMilliseconds: elapsedMilliseconds.value,
    currentStageIndex: currentStageIndex.value,
    started: started.value,
    running: running.value,
    isOvertime: elapsedMilliseconds.value > totalMilliseconds.value,
    stages: nextStages,
    stageDeviations: calcStageDeviation(nextStages),
    lastSavedAt: now
  }
}

function persist(force = false) {
  if (!training.value) return
  const now = Date.now()
  if (!force && now - lastPersistAt < 1000) return
  lastPersistAt = now
  const nextRecord = buildTrainingRecord()
  if (nextRecord) {
    training.value = nextRecord
    saveCurrentTraining(nextRecord)
  }
}

function syncElapsed(timestamp = Date.now()) {
  if (!running.value) return
  const delta = Math.max(0, timestamp - timerBaseTimestamp.value)
  elapsedMilliseconds.value = elapsedBaseMilliseconds.value + delta
  stageUsedMilliseconds.value[currentStageIndex.value] = (stageBaseMilliseconds.value[currentStageIndex.value] || 0) + delta
  persist()
}

function startInterval() {
  clearInterval(timer)
  resetTimerBase()
  timer = setInterval(() => {
    syncElapsed()
  }, 37)
}

function toggleTimer() {
  if (!training.value) return
  if (running.value) {
    syncElapsed()
    running.value = false
    clearInterval(timer)
    persist(true)
    return
  }

  if (!started.value) {
    started.value = true
    startedAt.value = new Date().toISOString()
  }

  running.value = true
  startInterval()
  persist(true)
}

function addMarker() {
  if (!training.value) return
  syncElapsed()
  const timeSeconds = Math.floor(elapsedMilliseconds.value / 1000)
  const marker = {
    id: createMarkerId(),
    timeSeconds,
    timeMilliseconds: elapsedMilliseconds.value,
    timeText: formatDuration(timeSeconds),
    stageName: currentStage.value.name || '',
    type: '重要节点',
    note: '',
    createdAt: new Date().toISOString()
  }
  training.value.markers = [...(training.value.markers || []), marker]
  persist(true)
  uni.showToast({ title: '已标记当前时间', icon: 'success' })
}

function restore() {
  const current = getCurrentTraining()
  if (!current) {
    training.value = null
    return
  }

  training.value = current
  currentStageIndex.value = Math.min(
    Math.max(Number(current.currentStageIndex) || 0, 0),
    Math.max(0, (current.stages || []).length - 1)
  )
  elapsedMilliseconds.value = Math.max(0, Math.floor(Number(current.usedMilliseconds) || (Number(current.usedSeconds) || 0) * 1000))
  stageUsedMilliseconds.value = (current.stages || []).map((stage) => {
    return Math.max(0, Math.floor(Number(stage.usedMilliseconds) || (Number(stage.usedSeconds) || 0) * 1000))
  })

  running.value = Boolean(current.running)
  started.value = Boolean(current.startedAt) || elapsedMilliseconds.value > 0
  startedAt.value = current.startedAt || ''

  if (running.value) {
    const savedAt = getSavedTimestamp(current)
    const awayMilliseconds = savedAt ? Math.max(0, Date.now() - savedAt) : 0
    if (awayMilliseconds) {
      elapsedMilliseconds.value += awayMilliseconds
      stageUsedMilliseconds.value[currentStageIndex.value] = (stageUsedMilliseconds.value[currentStageIndex.value] || 0) + awayMilliseconds
    }
    startInterval()
  } else {
    resetTimerBase()
  }
}

function exitFullscreen() {
  syncElapsed()
  persist(true)
  clearInterval(timer)
  uni.navigateBack({
    fail() {
      if (training.value?.templateId) {
        uni.redirectTo({ url: `/pages/training/timer?templateId=${encodeURIComponent(training.value.templateId)}` })
      } else {
        uni.switchTab({ url: '/pages/index/index' })
      }
    }
  })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

onLoad(restore)

onHide(() => {
  syncElapsed()
  persist(true)
})

onUnload(() => {
  syncElapsed()
  persist(true)
  clearInterval(timer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 42rpx 34rpx 56rpx;
  background: #f7f4ea;
  box-sizing: border-box;
}

.fullscreen-wrap {
  min-height: calc(100vh - 98rpx);
  display: flex;
  flex-direction: column;
}

.top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.label,
.time-label {
  display: block;
  font-size: 25rpx;
  color: #64706d;
}

.stage-name {
  display: block;
  margin-top: 12rpx;
  font-size: 42rpx;
  line-height: 1.25;
  font-weight: 750;
  color: #172121;
}

.status {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #eee8dc;
  color: #64706d;
  font-size: 23rpx;
}

.status.active {
  background: #e6f0ed;
  color: #0f5c5c;
}

.status.overtime {
  background: #fef2f2;
  color: #dc2626;
}

.time-card {
  margin-top: 42rpx;
  padding: 42rpx 34rpx;
  border-radius: 26rpx;
  background: #0f5c5c;
  box-shadow: 0 18rpx 38rpx rgba(15, 92, 92, 0.18);
}

.time-card .time-label {
  color: rgba(255, 255, 255, 0.74);
}

.main-time {
  display: block;
  margin-top: 28rpx;
  font-size: 86rpx;
  line-height: 1;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
}

.progress-track {
  height: 12rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #c99a2e;
}

.progress-text {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.78);
}

.stage-card {
  margin-top: 26rpx;
  padding: 32rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 20rpx;
  background: #ffffff;
}

.stage-time {
  display: block;
  margin-top: 18rpx;
  font-size: 58rpx;
  line-height: 1.1;
  font-weight: 750;
  color: #172121;
  white-space: nowrap;
}

.stage-meta {
  display: block;
  margin-top: 16rpx;
  font-size: 25rpx;
  color: #64706d;
}

.control-row {
  display: flex;
  gap: 18rpx;
  margin-top: auto;
  padding-top: 42rpx;
}

.primary-btn,
.secondary-btn,
.exit-btn {
  height: 88rpx;
  line-height: 88rpx;
  margin: 0;
  padding: 0;
  border-radius: 16rpx;
  font-size: 29rpx;
  font-weight: 650;
}

.primary-btn {
  flex: 1;
  background: #0f5c5c;
  color: #ffffff;
}

.secondary-btn {
  width: 190rpx;
  border: 1rpx solid #c99a2e;
  background: #f6e8c8;
  color: #7a570f;
}

.exit-btn {
  width: 100%;
  margin-top: 20rpx;
  border: 1rpx solid #e4ded0;
  background: #ffffff;
  color: #374151;
}

button::after {
  border: none;
}

.empty {
  padding-top: 160rpx;
  text-align: center;
}

.empty-title {
  display: block;
  margin-bottom: 30rpx;
  font-size: 30rpx;
  color: #64706d;
}

.primary-btn.single {
  width: 320rpx;
  margin: 0 auto;
}
</style>
