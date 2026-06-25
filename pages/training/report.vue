<template>
  <view class="page">
    <view v-if="record">
      <view class="header">
        <text class="page-title">训练报告</text>
        <text class="page-subtitle">{{ record.templateName }} · {{ dateText }}</text>
      </view>

      <view class="result-strip">
        <view class="result-item">
          <text class="result-value">{{ record.totalScore }}</text>
          <text class="result-label">总分</text>
        </view>
        <view class="result-item">
          <text class="result-value">{{ record.level }}</text>
          <text class="result-label">等级</text>
        </view>
        <view class="result-item">
          <text class="result-value">{{ usedText }}</text>
          <text class="result-label">{{ record.isOvertime ? '已超时' : '用时' }}</text>
        </view>
      </view>

      <view v-if="sortedMarkers.length" class="panel">
        <view class="panel-head">
          <text class="section-title">时间标记</text>
          <text class="panel-note">共 {{ sortedMarkers.length }} 个</text>
        </view>
        <view class="marker-list">
          <view v-for="marker in sortedMarkers" :key="marker.id" class="marker-row">
            <text class="marker-time">{{ getMarkerTime(marker) }}</text>
            <view class="marker-main">
              <text class="marker-title">{{ marker.type || '未分类' }} · {{ marker.stageName || '未记录阶段' }}</text>
              <text v-if="marker.note" class="marker-note">{{ marker.note }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="panel">
        <view class="panel-head">
          <text class="section-title">阶段偏差</text>
          <text class="panel-note">{{ stageDeviationNote }}</text>
        </view>
        <view v-if="stageDeviations.length" class="deviation-list">
          <view v-for="stage in stageDeviations" :key="stage.id" class="deviation-row">
            <view class="deviation-main">
              <text class="deviation-name">{{ stage.name }}</text>
              <text class="deviation-meta">计划{{ stage.plannedText }} · 实际{{ stage.actualText }}</text>
            </view>
            <text class="deviation-value" :class="{ overtime: stage.deviationSeconds > 0, saved: stage.deviationSeconds < 0 }">
              {{ stage.resultText }}
            </text>
          </view>
        </view>
        <text v-else class="empty-inline">本次训练暂无阶段偏差数据</text>
      </view>

      <view v-if="scoreReasons.length" class="panel">
        <text class="section-title">扣分原因</text>
        <view class="reason-list">
          <text v-for="reason in scoreReasons" :key="reason.name" class="reason-tag">{{ reason.name }}</text>
        </view>
      </view>

      <view v-if="record.nextPlan" class="panel">
        <text class="section-title">下次改进计划</text>
        <text class="plan-text">{{ record.nextPlan }}</text>
      </view>

      <view class="report-panel">
        <text class="section-title">复盘报告</text>
        <text class="report-text">{{ reportText }}</text>
      </view>

      <button class="primary-btn" @tap="copyReport">复制报告文本</button>
      <button class="gold-btn" :class="{ disabled: savingImage }" @tap="exportReportImage">
        {{ savingImage ? '正在导出...' : '导出报告图片' }}
      </button>
      <button class="secondary-btn" @tap="goHome">返回首页</button>

      <canvas canvas-id="reportCanvas" id="reportCanvas" class="export-canvas"></canvas>
    </view>

    <view v-else class="empty">
      <text class="empty-title">未找到训练报告</text>
      <button class="primary-btn single" @tap="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { clearCurrentTraining, getCurrentTraining, getTrainingRecordById, saveTrainingRecord } from '../../utils/storage.js'
import {
  generateTrainingReport,
  getRecordStageDeviations,
  getScoreReasonSummary,
  getSortedMarkers
} from '../../utils/report.js'
import { saveReportImage } from '../../utils/export.js'
import { formatDuration, formatDurationWithMs, getFormattedDate } from '../../utils/time.js'

const instance = getCurrentInstance()
const record = ref(null)
const savingImage = ref(false)

const sortedMarkers = computed(() => {
  if (!record.value) return []
  return getSortedMarkers(record.value.markers || [])
})

const stageDeviations = computed(() => {
  if (!record.value) return []
  return getRecordStageDeviations(record.value)
})

const stageDeviationNote = computed(() => {
  return stageDeviations.value.length ? `共 ${stageDeviations.value.length} 项` : ''
})

const scoreReasons = computed(() => {
  if (!record.value) return []
  return getScoreReasonSummary(record.value.scores || []).slice(0, 8)
})

const reportText = computed(() => {
  if (!record.value) return ''
  return generateTrainingReport(record.value)
})

const usedText = computed(() => {
  if (!record.value) return '0分0秒'
  return formatDuration(record.value.usedSeconds || 0)
})

const dateText = computed(() => {
  if (!record.value) return ''
  return getFormattedDate(record.value.startedAt || record.value.createdAt)
})

function getMarkerTime(marker) {
  if (marker.timeText) return marker.timeText
  if (marker.timeMilliseconds) return formatDurationWithMs(marker.timeMilliseconds || 0)
  return marker.timeText || formatDuration(marker.timeSeconds || 0)
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
    const result = await saveReportImage(record.value, 'reportCanvas', instance?.proxy)
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

function goHome() {
  clearCurrentTraining()
  uni.switchTab({ url: '/pages/index/index' })
}

onLoad((query) => {
  const id = query.id ? decodeURIComponent(query.id) : ''
  record.value = id ? getTrainingRecordById(id) : getCurrentTraining()
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
  margin-bottom: 26rpx;
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
  line-height: 1.45;
  color: #64706d;
}

.result-strip {
  display: flex;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
  overflow: hidden;
}

.result-item {
  flex: 1;
  padding: 28rpx 12rpx;
  border-right: 1rpx solid #e4ded0;
  text-align: center;
}

.result-item:last-child {
  border-right: none;
}

.result-value {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #0f5c5c;
}

.result-label {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #64706d;
}

.panel,
.report-panel {
  margin-top: 30rpx;
  padding: 28rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #172121;
}

.panel-note {
  font-size: 23rpx;
  color: #9aa3a0;
}

.marker-list,
.deviation-list {
  border-top: 1rpx solid #eee8dc;
}

.marker-row,
.deviation-row {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.marker-time {
  width: 120rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 700;
  color: #0f5c5c;
}

.marker-main,
.deviation-main {
  flex: 1;
  min-width: 0;
}

.marker-title,
.deviation-name {
  display: block;
  font-size: 25rpx;
  font-weight: 600;
  color: #172121;
}

.marker-note,
.deviation-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: #64706d;
}

.deviation-value {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #64706d;
}

.deviation-value.overtime {
  color: #b7791f;
  font-weight: 600;
}

.deviation-value.saved {
  color: #0f766e;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.reason-tag {
  height: 44rpx;
  line-height: 44rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: #e6f0ed;
  color: #0f5c5c;
  font-size: 22rpx;
}

.plan-text,
.report-text {
  display: block;
  margin-top: 18rpx;
  white-space: pre-line;
  font-size: 27rpx;
  line-height: 1.78;
  color: #172121;
}

.empty-inline {
  display: block;
  padding: 22rpx 0 4rpx;
  font-size: 25rpx;
  color: #9aa3a0;
}

.primary-btn,
.secondary-btn,
.gold-btn {
  height: 86rpx;
  line-height: 86rpx;
  margin: 28rpx 0 0;
  padding: 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.primary-btn {
  background: #0f5c5c;
  color: #ffffff;
}

.gold-btn {
  border: 1rpx solid #c99a2e;
  background: #f6e8c8;
  color: #7a570f;
}

.gold-btn.disabled {
  opacity: 0.6;
}

.secondary-btn {
  border: 1rpx solid #e4ded0;
  background: #ffffff;
  color: #374151;
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
