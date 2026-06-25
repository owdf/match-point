<template>
  <view class="page">
    <view class="header">
      <text class="page-title">赛前检查</text>
      <text class="page-subtitle">正式训练或比赛前快速确认设备与材料</text>
    </view>

    <view class="progress-panel">
      <text class="progress-value">{{ checkedCount }}/{{ totalCount }}</text>
      <text class="progress-label">已完成检查项</text>
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <view class="check-list">
      <view v-for="group in state.groups" :key="group.name" class="check-group">
        <text class="group-title">{{ group.name }}</text>
        <view
          v-for="item in group.items"
          :key="item.id"
          class="check-row"
          @tap="toggleItem(item.id)"
        >
          <text class="check-box" :class="{ checked: item.checked }">{{ item.checked ? '✓' : '' }}</text>
          <text class="check-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <button class="secondary-btn" @tap="resetState">一键重置检查状态</button>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getPrecheckState, resetPrecheckState, savePrecheckState } from '../../utils/storage.js'

const state = ref(getPrecheckState())

const totalCount = computed(() => {
  return state.value.groups.reduce((sum, group) => sum + group.items.length, 0)
})

const checkedCount = computed(() => {
  return state.value.groups.reduce((sum, group) => {
    return sum + group.items.filter((item) => item.checked).length
  }, 0)
})

const progress = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((checkedCount.value / totalCount.value) * 100)
})

function refresh() {
  state.value = getPrecheckState()
}

function toggleItem(itemId) {
  state.value.groups = state.value.groups.map((group) => ({
    ...group,
    items: group.items.map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ))
  }))
  state.value = savePrecheckState(state.value)
}

function resetState() {
  uni.showModal({
    title: '重置检查',
    content: '确认将所有检查项恢复为未完成状态？',
    success(res) {
      if (!res.confirm) return
      state.value = resetPrecheckState()
      uni.showToast({ title: '已重置', icon: 'success' })
    }
  })
}

onShow(refresh)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 34rpx 56rpx;
  background: #f7f4ea;
  box-sizing: border-box;
}

.header {
  margin-bottom: 28rpx;
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

.progress-panel {
  padding: 28rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
}

.progress-value {
  display: block;
  font-size: 44rpx;
  line-height: 1.1;
  font-weight: 750;
  color: #0f5c5c;
}

.progress-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64706d;
}

.progress-track {
  height: 12rpx;
  margin-top: 24rpx;
  border-radius: 999rpx;
  background: #eee8dc;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #c99a2e;
}

.check-list {
  margin-top: 30rpx;
}

.check-group {
  margin-top: 34rpx;
}

.check-group:first-child {
  margin-top: 0;
}

.group-title {
  display: block;
  margin-bottom: 10rpx;
  font-size: 28rpx;
  font-weight: 650;
  color: #172121;
}

.check-row {
  display: flex;
  align-items: center;
  min-height: 86rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #e4ded0;
}

.check-box {
  width: 42rpx;
  height: 42rpx;
  line-height: 42rpx;
  margin-right: 18rpx;
  border: 1rpx solid #d6cbb8;
  border-radius: 8rpx;
  text-align: center;
  font-size: 26rpx;
  color: #ffffff;
}

.check-box.checked {
  border-color: #0f5c5c;
  background: #0f5c5c;
}

.check-text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 1.45;
  color: #172121;
}

.secondary-btn {
  height: 84rpx;
  line-height: 84rpx;
  margin: 42rpx 0 0;
  padding: 0;
  border-radius: 14rpx;
  border: 1rpx solid #c99a2e;
  background: #f6e8c8;
  color: #7a570f;
  font-size: 28rpx;
  font-weight: 600;
}

button::after {
  border: none;
}
</style>
