<template>
  <view class="app-page home-page">
    <view class="slogan-hero">
      <text class="slogan-zh">{{ currentSlogan.zh }}</text>
      <text class="slogan-en">{{ currentSlogan.en }}</text>
    </view>

    <view class="app-dashboard">
      <view class="app-metric">
        <text class="app-metric-value">{{ totalCount }}</text>
        <text class="app-metric-label">累计训练</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value">{{ averageScore }}</text>
        <text class="app-metric-label">平均分</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value">{{ highestScore }}</text>
        <text class="app-metric-label">最高分</text>
      </view>
    </view>

    <view class="start-card app-primary-card" @tap="goTemplate">
      <view class="start-copy">
        <text class="start-label">主要操作</text>
        <text class="start-title">开始训练</text>
        <text class="start-desc">选择训练模板，进入阶段计时与复盘流程</text>
      </view>
      <text class="start-arrow">›</text>
    </view>

    <view class="app-section">
      <view class="app-section-head">
        <text class="app-section-title">最近一次训练</text>
        <text v-if="latestRecord" class="app-section-note" @tap="goHistory">查看记录</text>
      </view>

      <view v-if="latestRecord" class="recent-card app-surface-card" @tap="goHistory">
        <view class="recent-main">
          <text class="recent-title">{{ latestRecord.templateName || '未命名训练' }}</text>
          <text class="recent-date">{{ latestDate }}</text>
        </view>
        <view class="recent-score">
          <text class="score-value">{{ latestRecord.totalScore || 0 }}</text>
          <text class="app-chip" :class="{ 'app-chip-gold': latestRecord.level === '优秀' }">{{ latestRecord.level || '未评分' }}</text>
        </view>
      </view>

      <view v-else class="empty-card app-surface-card">
        <text class="empty-title">暂无训练记录</text>
        <text class="empty-desc">从“开始训练”创建第一条本地训练复盘。</text>
      </view>
    </view>

    <view v-if="latestNextPlan" class="app-section">
      <view class="app-section-head">
        <text class="app-section-title">上次改进计划</text>
      </view>
      <view class="plan-card app-surface-card">
        <text class="plan-text">{{ latestNextPlan }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { getStatistics, initDefaultTemplates } from '../../utils/storage.js'
import { getFormattedDate } from '../../utils/time.js'
import slogans from '../../data/slogans.json'

const fallbackSlogan = {
  en: 'Stay Focused',
  zh: '保持专注'
}

const statistics = ref({
  count: 0,
  averageScore: 0,
  highestScore: 0,
  recentRecords: []
})
const currentSlogan = ref(fallbackSlogan)
let sloganTimer = null

const totalCount = computed(() => statistics.value.count || 0)
const averageScore = computed(() => statistics.value.averageScore || 0)
const highestScore = computed(() => statistics.value.highestScore || 0)
const latestRecord = computed(() => {
  return statistics.value.recentRecords && statistics.value.recentRecords[0]
})
const latestDate = computed(() => {
  if (!latestRecord.value) return ''
  return getFormattedDate(latestRecord.value.startedAt || latestRecord.value.createdAt)
})
const latestNextPlan = computed(() => {
  return latestRecord.value && latestRecord.value.nextPlan ? latestRecord.value.nextPlan : ''
})

function refresh() {
  initDefaultTemplates()
  statistics.value = getStatistics()
}

function pickSlogan() {
  const list = Array.isArray(slogans) && slogans.length ? slogans : [fallbackSlogan]
  if (list.length === 1) return list[0]

  const nextList = list.filter((item) => item.zh !== currentSlogan.value.zh || item.en !== currentSlogan.value.en)
  return nextList[Math.floor(Math.random() * nextList.length)]
}

function rotateSlogan() {
  currentSlogan.value = pickSlogan()
}

function startSloganCarousel() {
  clearInterval(sloganTimer)
  rotateSlogan()
  sloganTimer = setInterval(rotateSlogan, 4200)
}

function stopSloganCarousel() {
  clearInterval(sloganTimer)
  sloganTimer = null
}

function goTemplate() {
  uni.switchTab({ url: '/pages/template/list' })
}

function goHistory() {
  uni.switchTab({ url: '/pages/history/list' })
}

refresh()
onShow(() => {
  refresh()
  startSloganCarousel()
})
onHide(stopSloganCarousel)
onUnload(stopSloganCarousel)
</script>

<style scoped>
.home-page {
  padding-top: 42rpx;
}

.slogan-hero {
  min-height: 190rpx;
  margin-bottom: 32rpx;
  padding: 34rpx 28rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.slogan-zh {
  display: block;
  max-width: 100%;
  font-size: 46rpx;
  line-height: 1.22;
  font-weight: 820;
  color: #172121;
}

.slogan-en {
  display: block;
  max-width: 100%;
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.45;
  color: #64706d;
}

.start-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 28rpx;
}

.start-copy {
  flex: 1;
  min-width: 0;
}

.start-label {
  display: block;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.72);
}

.start-title {
  display: block;
  margin-top: 10rpx;
  font-size: 42rpx;
  line-height: 1.2;
  font-weight: 800;
  color: #ffffff;
}

.start-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
}

.start-arrow {
  width: 64rpx;
  height: 64rpx;
  line-height: 58rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  text-align: center;
  font-size: 54rpx;
  color: #ffffff;
}

.recent-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
}

.recent-main {
  flex: 1;
  min-width: 0;
}

.recent-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 30rpx;
  font-weight: 720;
  color: #172121;
}

.recent-date {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64706d;
}

.recent-score {
  flex-shrink: 0;
  text-align: right;
}

.score-value {
  display: block;
  margin-bottom: 10rpx;
  font-size: 40rpx;
  line-height: 1;
  font-weight: 800;
  color: #073f3f;
}

.empty-card {
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 29rpx;
  font-weight: 700;
  color: #172121;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: #64706d;
}

.plan-card {
  background: #fbfaf4;
}

.plan-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: #172121;
}
</style>
