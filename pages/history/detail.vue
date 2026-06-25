<template>
  <view class="page">
    <view v-if="record">
      <view class="header">
        <text class="page-title">训练详情</text>
        <text class="page-subtitle">{{ record.templateName }} · {{ formatDate(record) }}</text>
      </view>

      <view class="section">
        <text class="section-title">基本信息</text>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-value">{{ formatDuration(record.usedSeconds) }}</text>
            <text class="info-label">总用时</text>
          </view>
          <view class="info-item">
            <text class="info-value">{{ record.isOvertime ? '超时' : '未超时' }}</text>
            <text class="info-label">时间状态</text>
          </view>
          <view class="info-item">
            <text class="info-value">{{ record.totalScore }}分</text>
            <text class="info-label">总分</text>
          </view>
          <view class="info-item">
            <text class="info-value">{{ record.level }}</text>
            <text class="info-label">等级</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">阶段用时</text>
        <view v-if="(record.stages || []).length" class="plain-list">
          <view v-for="stage in record.stages" :key="stage.id" class="plain-row">
            <text class="plain-name">{{ stage.name }}</text>
            <text class="plain-value">{{ formatDuration(stage.usedSeconds || 0) }} / {{ stage.minutes }}分钟</text>
          </view>
        </view>
        <text v-else class="empty-line">本次训练暂无阶段用时数据</text>
      </view>

      <view class="section">
        <text class="section-title">阶段偏差</text>
        <view v-if="stageDeviations.length" class="plain-list">
          <view v-for="stage in stageDeviations" :key="stage.id" class="plain-row deviation-row">
            <view class="plain-main">
              <text class="plain-name">{{ stage.name }}</text>
              <text class="plain-sub">计划{{ stage.plannedText }}，实际{{ stage.actualText }}</text>
            </view>
            <text class="plain-value" :class="{ overtime: stage.deviationSeconds > 0, saved: stage.deviationSeconds < 0 }">
              {{ stage.resultText }}
            </text>
          </view>
        </view>
        <text v-else class="empty-line">本次训练暂无阶段偏差数据</text>
      </view>

      <view class="section">
        <text class="section-title">时间标记</text>
        <view v-if="sortedMarkers.length" class="marker-list">
          <view v-for="marker in sortedMarkers" :key="marker.id" class="marker-row">
            <view class="marker-time">
              <text class="marker-time-text">{{ getMarkerTime(marker) }}</text>
            </view>
            <view class="marker-main">
              <view class="marker-line">
                <text class="marker-type">{{ marker.type || '未分类' }}</text>
                <text class="marker-stage">{{ marker.stageName || '未记录阶段' }}</text>
              </view>
              <text v-if="marker.note" class="marker-note">{{ marker.note }}</text>
            </view>
          </view>
        </view>
        <text v-else class="empty-line">本次训练暂无时间标记</text>
      </view>

      <view class="section">
        <text class="section-title">标记区间</text>
        <text v-if="sortedMarkers.length < 2" class="empty-line">至少记录两个时间标记后，可查看区间用时。</text>
        <view v-else class="interval-list">
          <view
            v-for="interval in markerIntervals"
            :key="interval.id"
            class="interval-row"
            :class="{ longest: interval.isLongest }"
          >
            <text class="interval-dot"></text>
            <view class="interval-main">
              <view class="interval-time-row">
                <text class="interval-time">{{ interval.startTimeText }} → {{ interval.endTimeText }}</text>
                <text v-if="interval.isLongest" class="longest-tag">最长区间</text>
              </view>
              <text class="interval-name">{{ interval.startName }} 到 {{ interval.endName }}</text>
              <text class="interval-duration">用时 {{ interval.durationText }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">清单完成情况</text>
        <view v-for="group in checklistGroups" :key="group.name" class="check-group">
          <text class="group-title">{{ group.name }}</text>
          <view v-for="item in group.items" :key="item.id" class="check-row">
            <text class="check-state" :class="{ done: item.checked }">{{ item.checked ? '已完成' : '未完成' }}</text>
            <text class="check-text">{{ item.text }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">评分明细</text>
        <view class="score-detail-list">
          <view v-for="score in record.scores || []" :key="score.id" class="score-detail-row">
            <view class="score-detail-top">
              <text class="plain-name">{{ score.name }}</text>
              <text class="plain-value">{{ score.score }}/{{ score.maxScore }}分</text>
            </view>
            <view v-if="score.reasons && score.reasons.length" class="reason-list readonly">
              <text v-for="reason in score.reasons" :key="reason" class="reason-tag">{{ reason }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section" v-if="record.notes">
        <text class="section-title">复盘备注</text>
        <text class="paragraph">{{ record.notes }}</text>
      </view>

      <view class="section" v-if="record.nextPlan">
        <text class="section-title">下次改进计划</text>
        <text class="paragraph">{{ record.nextPlan }}</text>
      </view>

      <view class="section">
        <text class="section-title">报告内容</text>
        <text class="report-text">{{ reportText }}</text>
      </view>

      <button class="primary-btn" @tap="copyReport">复制报告</button>
      <button class="secondary-btn" :class="{ disabled: savingImage }" @tap="exportReportImage">
        {{ savingImage ? '正在导出...' : '导出报告图片' }}
      </button>

      <canvas canvas-id="detailReportCanvas" id="detailReportCanvas" class="export-canvas"></canvas>
    </view>

    <view v-else class="empty">
      <text class="empty-title">未找到训练记录</text>
      <button class="primary-btn single" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getTrainingRecordById, saveTrainingRecord } from '../../utils/storage.js'
import { generateTrainingReport, getMarkerIntervals, getRecordStageDeviations, getSortedMarkers } from '../../utils/report.js'
import { saveReportImage } from '../../utils/export.js'
import { formatDuration, formatDurationWithMs, getFormattedDate } from '../../utils/time.js'

const instance = getCurrentInstance()
const record = ref(null)
const savingImage = ref(false)
const defaultCategories = ['训练前', '训练中', '训练后']

const checklistGroups = computed(() => {
  if (!record.value) return []
  const groups = {}
  ;(record.value.checklist || []).forEach((item) => {
    const category = item.category || '其他'
    if (!groups[category]) groups[category] = []
    groups[category].push(item)
  })
  const ordered = defaultCategories
    .filter((name) => groups[name] && groups[name].length)
    .map((name) => ({ name, items: groups[name] }))
  const extra = Object.keys(groups)
    .filter((name) => !defaultCategories.includes(name))
    .map((name) => ({ name, items: groups[name] }))
  return [...ordered, ...extra]
})

const sortedMarkers = computed(() => {
  if (!record.value) return []
  return getSortedMarkers(record.value.markers || [])
})

const markerIntervals = computed(() => {
  if (!record.value) return []
  return getMarkerIntervals(record.value.markers || [])
})

const stageDeviations = computed(() => {
  if (!record.value) return []
  return getRecordStageDeviations(record.value)
})

const reportText = computed(() => {
  if (!record.value) return ''
  return generateTrainingReport(record.value)
})

function getMarkerTime(marker) {
  if (marker.timeText) return marker.timeText
  if (marker.timeMilliseconds) return formatDurationWithMs(marker.timeMilliseconds || 0)
  return marker.timeText || formatDuration(marker.timeSeconds || 0)
}

function formatDate(item) {
  return getFormattedDate(item.startedAt || item.createdAt)
}

function copyReport() {
  uni.setClipboardData({
    data: reportText.value,
    success() {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

async function exportReportImage() {
  if (!record.value || savingImage.value) return
  savingImage.value = true
  try {
    const result = await saveReportImage(record.value, 'detailReportCanvas', instance?.proxy)
    record.value = saveTrainingRecord({
      ...record.value,
      reportImagePath: result.tempFilePath
    })

    if (result.saved) {
      uni.showToast({ title: '已保存到相册', icon: 'success' })
    } else {
      uni.showModal({
        title: '图片已生成',
        content: `${result.error || '当前平台未完成保存'}，可继续复制报告文本或在支持的 App 环境保存。`,
        showCancel: false
      })
    }
  } catch (error) {
    uni.showToast({ title: '导出失败，请复制报告文本', icon: 'none' })
  } finally {
    savingImage.value = false
  }
}

function goBack() {
  uni.navigateBack({
    fail() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}

onLoad((query) => {
  const id = query.id ? decodeURIComponent(query.id) : ''
  record.value = id ? getTrainingRecordById(id) : null
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 34rpx 34rpx 48rpx;
  background: #f7f4ea;
  box-sizing: border-box;
}

.header {
  margin-bottom: 24rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #172121;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  color: #64706d;
}

.section {
  margin-top: 24rpx;
  padding: 28rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.section-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #172121;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.info-item {
  padding: 20rpx;
  border-radius: 14rpx;
  background: #fbfaf4;
}

.info-value {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #0f5c5c;
}

.info-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #64706d;
}

.plain-list,
.marker-list,
.interval-list,
.score-detail-list {
  border-top: 1rpx solid #eee8dc;
}

.plain-row,
.score-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 21rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.score-detail-row {
  display: block;
}

.score-detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.plain-main,
.plain-name {
  flex: 1;
  min-width: 0;
}

.plain-name {
  font-size: 26rpx;
  color: #172121;
}

.plain-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #64706d;
}

.plain-value {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #64706d;
}

.plain-value.overtime {
  color: #b7791f;
  font-weight: 600;
}

.plain-value.saved {
  color: #0f766e;
}

.marker-row {
  display: flex;
  align-items: flex-start;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.marker-time {
  width: 128rpx;
  flex-shrink: 0;
}

.marker-time-text {
  font-size: 25rpx;
  font-weight: 700;
  color: #0f5c5c;
}

.marker-main {
  flex: 1;
  min-width: 0;
}

.marker-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.marker-type {
  font-size: 26rpx;
  font-weight: 600;
  color: #172121;
}

.marker-stage {
  font-size: 23rpx;
  color: #64706d;
}

.marker-note {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: #374151;
}

.interval-row {
  display: flex;
  align-items: flex-start;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.interval-dot {
  width: 14rpx;
  height: 14rpx;
  margin: 8rpx 18rpx 0 0;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}

.interval-row.longest .interval-dot {
  background: #c99a2e;
}

.interval-main {
  flex: 1;
  min-width: 0;
}

.interval-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.interval-time {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  font-weight: 700;
  color: #0f5c5c;
}

.longest-tag {
  flex-shrink: 0;
  height: 38rpx;
  line-height: 38rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #f6e8c8;
  color: #7a570f;
  font-size: 21rpx;
  font-weight: 600;
}

.interval-name,
.interval-duration {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.5;
  color: #172121;
}

.interval-duration {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64706d;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.reason-tag {
  height: 42rpx;
  line-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #e6f0ed;
  color: #0f5c5c;
  font-size: 21rpx;
}

.empty-line {
  display: block;
  padding: 14rpx 0 4rpx;
  font-size: 25rpx;
  color: #9aa3a0;
}

.check-group {
  margin-top: 22rpx;
}

.check-group:first-of-type {
  margin-top: 0;
}

.group-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #374151;
}

.check-row {
  display: flex;
  align-items: flex-start;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.check-state {
  width: 96rpx;
  flex-shrink: 0;
  font-size: 22rpx;
  color: #dc2626;
}

.check-state.done {
  color: #0f766e;
}

.check-text {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.45;
  color: #172121;
}

.paragraph,
.report-text {
  display: block;
  white-space: pre-line;
  font-size: 26rpx;
  line-height: 1.75;
  color: #172121;
}

.primary-btn,
.secondary-btn {
  height: 86rpx;
  line-height: 86rpx;
  margin: 30rpx 0 0;
  padding: 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.primary-btn {
  background: #0f5c5c;
  color: #ffffff;
}

.secondary-btn {
  border: 1rpx solid #c99a2e;
  background: #f6e8c8;
  color: #7a570f;
}

.secondary-btn.disabled {
  opacity: 0.6;
}

button::after {
  border: none;
}

.export-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 750px;
  height: 1280px;
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
