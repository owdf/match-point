<template>
  <view class="app-page statistics-page">
    <view class="app-topbar">
      <view>
        <text class="app-title">统计分析</text>
        <text class="app-subtitle">基于本地训练记录生成，不上传任何数据</text>
      </view>
    </view>

    <view class="stats-dashboard">
      <view class="app-metric">
        <text class="app-metric-value">{{ statistics.count }}</text>
        <text class="app-metric-label">累计训练</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value">{{ statistics.averageScore }}</text>
        <text class="app-metric-label">平均分</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value">{{ statistics.highestScore }}</text>
        <text class="app-metric-label">最高分</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value">{{ statistics.overtimeCount }}</text>
        <text class="app-metric-label">超时次数</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value small">{{ statistics.markerCount }}</text>
        <text class="app-metric-label">累计时间标记</text>
      </view>
      <view class="app-metric">
        <text class="app-metric-value small">{{ formatDuration(statistics.averageUsedSeconds) }}</text>
        <text class="app-metric-label">平均用时</text>
      </view>
    </view>

    <view class="section app-surface-card">
      <text class="section-title">最近7次训练成绩</text>
      <view v-if="statistics.recentRecords.length" class="trend-list">
        <view v-for="record in statistics.recentRecords" :key="record.id" class="trend-row">
          <view class="trend-meta">
            <text class="trend-name">{{ record.templateName || '未命名训练' }}</text>
            <text class="trend-date">{{ formatDate(record) }}</text>
          </view>
          <view class="bar-wrap">
            <view class="bar" :style="{ width: getScoreWidth(record.totalScore) + '%' }"></view>
          </view>
          <text class="trend-score">{{ record.totalScore || 0 }}</text>
        </view>
      </view>
      <view v-else class="empty-inline">暂无训练成绩</view>
    </view>

    <view class="section app-surface-card">
      <text class="section-title">最常见标记类型</text>
      <view v-if="statistics.commonMarkerTypes.length" class="rank-list">
        <view v-for="item in statistics.commonMarkerTypes.slice(0, 5)" :key="item.name" class="rank-row">
          <view class="rank-main">
            <text class="rank-name">{{ item.name }}</text>
            <view class="rank-bar-wrap">
              <view class="rank-bar gold" :style="{ width: getRankWidth(item, statistics.commonMarkerTypes) + '%' }"></view>
            </view>
          </view>
          <text class="rank-count">{{ item.count }}次</text>
        </view>
      </view>
      <view v-else class="empty-inline">暂无时间标记数据</view>
    </view>

    <view class="section app-surface-card">
      <text class="section-title">最常见扣分原因</text>
      <view v-if="statistics.commonScoreReasons.length" class="rank-list">
        <view v-for="item in statistics.commonScoreReasons.slice(0, 5)" :key="item.name" class="rank-row">
          <view class="rank-main">
            <text class="rank-name">{{ item.name }}</text>
            <view class="rank-bar-wrap">
              <view class="rank-bar" :style="{ width: getRankWidth(item, statistics.commonScoreReasons) + '%' }"></view>
            </view>
          </view>
          <text class="rank-count">{{ item.count }}次</text>
        </view>
      </view>
      <view v-else class="empty-inline">暂无扣分原因记录</view>
    </view>

    <view class="section app-surface-card">
      <text class="section-title">最常超时阶段</text>
      <view v-if="statistics.commonOvertimeStages.length" class="rank-list">
        <view v-for="item in statistics.commonOvertimeStages.slice(0, 5)" :key="item.name" class="rank-row">
          <view class="rank-main">
            <text class="rank-name">{{ item.name }}</text>
            <text class="rank-sub">累计超出 {{ formatDuration(item.totalSeconds) }}</text>
          </view>
          <text class="rank-count">{{ item.count }}次</text>
        </view>
      </view>
      <view v-else class="empty-inline">暂无阶段超时数据</view>
    </view>

    <view class="section app-surface-card">
      <text class="section-title">最常见低分项</text>
      <view v-if="statistics.commonLowItems.length" class="low-list">
        <view v-for="item in statistics.commonLowItems.slice(0, 5)" :key="item.name" class="low-row">
          <text class="low-name">{{ item.name }}</text>
          <text class="low-count">{{ item.count }}次</text>
        </view>
      </view>
      <view v-else class="empty-inline">暂无明显低分项</view>
    </view>
    <view class="app-bottom-space"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStatistics } from '../../utils/storage.js'
import { formatDuration, getFormattedDate } from '../../utils/time.js'

const statistics = ref(createEmptyStatistics())

function createEmptyStatistics() {
  return {
    count: 0,
    averageScore: 0,
    highestScore: 0,
    averageUsedSeconds: 0,
    overtimeCount: 0,
    markerCount: 0,
    averageMarkerCount: 0,
    recentRecords: [],
    commonLowItems: [],
    commonMarkerTypes: [],
    commonScoreReasons: [],
    commonOvertimeStages: []
  }
}

function refresh() {
  statistics.value = {
    ...createEmptyStatistics(),
    ...getStatistics()
  }
}

function formatDate(record) {
  return getFormattedDate(record.startedAt || record.createdAt)
}

function getScoreWidth(score) {
  return Math.max(4, Math.min(100, Number(score) || 0))
}

function getRankWidth(item, list) {
  const max = Math.max(...list.map((target) => Number(target.count) || 0), 1)
  return Math.max(8, Math.round(((Number(item.count) || 0) / max) * 100))
}

refresh()
onShow(refresh)
</script>

<style scoped>
.statistics-page {
  padding-top: 42rpx;
}

.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.app-metric-value.small {
  font-size: 30rpx;
}

.section {
  margin-top: 24rpx;
}

.section-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #172121;
}

.trend-row,
.rank-row,
.low-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.trend-row:last-child,
.rank-row:last-child,
.low-row:last-child {
  border-bottom: none;
}

.trend-meta {
  width: 230rpx;
  min-width: 0;
}

.trend-name,
.rank-name,
.low-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24rpx;
  color: #172121;
}

.trend-date,
.rank-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9aa3a0;
}

.bar-wrap,
.rank-bar-wrap {
  flex: 1;
  height: 14rpx;
  border-radius: 999rpx;
  background: #eee8dc;
  overflow: hidden;
}

.rank-bar-wrap {
  width: 100%;
  margin-top: 10rpx;
}

.bar,
.rank-bar {
  height: 100%;
  border-radius: 999rpx;
  background: #0f5c5c;
}

.rank-bar.gold {
  background: #c99a2e;
}

.rank-main {
  flex: 1;
  min-width: 0;
}

.trend-score,
.rank-count,
.low-count {
  width: 70rpx;
  flex-shrink: 0;
  text-align: right;
  font-size: 24rpx;
  font-weight: 600;
  color: #64706d;
}

.empty-inline {
  padding: 26rpx 0;
  text-align: center;
  font-size: 25rpx;
  color: #9aa3a0;
}
</style>
