<template>
  <view class="page">
    <view v-if="training">
      <view class="header">
        <text class="page-title">任务清单</text>
        <text class="page-subtitle">{{ training.templateName }} · 请按实际完成情况勾选</text>
      </view>

      <view v-for="category in categories" :key="category" class="group">
        <view class="group-title-row">
          <text class="group-title">{{ category }}</text>
          <text class="group-count">{{ checkedCount(category) }}/{{ groupedChecklist[category].length }}</text>
        </view>
        <view class="list">
          <view
            v-for="item in groupedChecklist[category]"
            :key="item.id"
            class="check-row"
            @tap="toggleItem(item.id)"
          >
            <view class="box" :class="{ checked: item.checked }">
              <text v-if="item.checked" class="check-mark">✓</text>
            </view>
            <text class="check-text">{{ item.text }}</text>
          </view>
        </view>
      </view>

      <button class="primary-btn" @tap="nextStep">下一步：自评打分</button>
    </view>

    <view v-else class="empty">
      <text class="empty-title">暂无进行中的训练</text>
      <button class="primary-btn single" @tap="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentTraining, saveCurrentTraining } from '../../utils/storage.js'

const training = ref(null)
const categories = ['训练前', '训练中', '训练后']

const groupedChecklist = computed(() => {
  const groups = {
    训练前: [],
    训练中: [],
    训练后: []
  }
  if (!training.value) return groups
  ;(training.value.checklist || []).forEach((item) => {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  })
  return groups
})

function refresh() {
  training.value = getCurrentTraining()
}

function checkedCount(category) {
  return groupedChecklist.value[category].filter((item) => item.checked).length
}

function toggleItem(id) {
  if (!training.value) return
  const item = training.value.checklist.find((entry) => entry.id === id)
  if (item) {
    item.checked = !item.checked
    saveCurrentTraining(training.value)
  }
}

function nextStep() {
  if (training.value) saveCurrentTraining(training.value)
  uni.navigateTo({ url: '/pages/training/score' })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

refresh()
onShow(refresh)
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
  font-size: 38rpx;
  font-weight: 700;
  color: #172121;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.45;
  color: #64706d;
}

.group {
  margin-top: 34rpx;
}

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #172121;
}

.group-count {
  font-size: 23rpx;
  color: #64706d;
}

.list {
  border-top: 1rpx solid #e4ded0;
}

.check-row {
  display: flex;
  align-items: center;
  min-height: 86rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #eee8dc;
  box-sizing: border-box;
}

.box {
  width: 38rpx;
  height: 38rpx;
  margin-right: 20rpx;
  border: 2rpx solid #d6cbb8;
  border-radius: 6rpx;
  background: #ffffff;
  text-align: center;
  line-height: 34rpx;
  box-sizing: border-box;
}

.box.checked {
  border-color: #0f5c5c;
  background: #0f5c5c;
}

.check-mark {
  font-size: 24rpx;
  color: #ffffff;
}

.check-text {
  flex: 1;
  font-size: 27rpx;
  line-height: 1.45;
  color: #172121;
}

.primary-btn {
  height: 84rpx;
  line-height: 84rpx;
  margin: 46rpx 0 0;
  padding: 0;
  border-radius: 14rpx;
  background: #0f5c5c;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
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
