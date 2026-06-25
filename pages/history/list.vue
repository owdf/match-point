<template>
  <view class="app-page history-page">
    <view class="app-topbar">
      <view>
        <text class="app-title">记录</text>
        <text class="app-subtitle">查看已保存的训练结果和复盘报告</text>
      </view>
    </view>

    <view v-if="records.length" class="record-list">
      <view
        v-for="record in records"
        :key="record.id"
        class="record-card app-surface-card"
        @tap="openDetail(record)"
      >
        <view class="record-head">
          <view class="record-main">
            <text class="record-title">{{ record.templateName || '未命名训练' }}</text>
            <text class="record-date">{{ formatDate(record) }}</text>
          </view>
          <view class="record-score">
            <text class="score">{{ record.totalScore || 0 }}</text>
            <text class="score-label">分</text>
          </view>
        </view>

        <view class="record-meta-row">
          <text class="app-chip">用时 {{ formatDuration(record.usedSeconds || 0) }}</text>
          <text class="app-chip" :class="{ 'app-chip-gold': record.level === '优秀' }">{{ record.level || '未评分' }}</text>
          <text class="app-chip" :class="{ 'app-chip-danger': record.isOvertime }">{{ record.isOvertime ? '超时' : '未超时' }}</text>
        </view>

        <view class="record-actions">
          <text class="open-link">查看详情</text>
          <text class="delete-link" @tap.stop="removeRecord(record)">删除</text>
        </view>
      </view>
    </view>

    <view v-else class="app-empty">
      <text class="app-empty-title">暂无训练记录</text>
      <text class="app-empty-desc">完成一次训练并保存评分后，记录会显示在这里。</text>
      <button class="app-button-primary empty-action" @tap="startTraining">开始训练</button>
    </view>

    <view class="app-bottom-space"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { deleteTrainingRecord, getTrainingRecords } from '../../utils/storage.js'
import { formatDuration, getFormattedDate } from '../../utils/time.js'

const records = ref([])

function refresh() {
  records.value = getTrainingRecords()
}

function formatDate(record) {
  return getFormattedDate(record.startedAt || record.createdAt)
}

function openDetail(record) {
  uni.navigateTo({
    url: `/pages/history/detail?id=${encodeURIComponent(record.id)}`
  })
}

function removeRecord(record) {
  uni.showModal({
    title: '删除记录',
    content: '确认删除这条训练记录吗？',
    confirmText: '删除',
    confirmColor: '#DC2626',
    success(res) {
      if (res.confirm) {
        deleteTrainingRecord(record.id)
        refresh()
      }
    }
  })
}

function startTraining() {
  uni.switchTab({ url: '/pages/template/list' })
}

refresh()
onShow(refresh)
</script>

<style scoped>
.history-page {
  padding-top: 42rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.record-card {
  padding: 26rpx;
}

.record-head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.record-main {
  flex: 1;
  min-width: 0;
}

.record-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 30rpx;
  line-height: 1.35;
  font-weight: 720;
  color: #172121;
}

.record-date {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64706d;
}

.record-score {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.score {
  font-size: 42rpx;
  line-height: 1;
  font-weight: 800;
  color: #073f3f;
}

.score-label {
  font-size: 22rpx;
  color: #64706d;
}

.record-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 20rpx;
}

.record-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #e4ded0;
}

.open-link,
.delete-link {
  font-size: 24rpx;
  font-weight: 650;
}

.open-link {
  color: #0f5c5c;
}

.delete-link {
  color: #dc2626;
}

.empty-action {
  width: 320rpx;
  margin: 32rpx auto 0;
}
</style>
