<template>
  <view class="page">
    <view class="header">
      <text class="page-title">时间计算</text>
      <text class="page-subtitle">计算训练节点之间的时间差</text>
    </view>

    <view class="time-section">
      <view class="time-block">
        <text class="block-title">开始时间</text>
        <view class="input-row">
          <input
            class="time-input"
            type="number"
            maxlength="3"
            :value="startTime.minutes"
            placeholder="0"
            @input="changeTimePart('start', 'minutes', $event)"
          />
          <text class="unit">分</text>
          <input
            class="time-input seconds-input"
            type="number"
            maxlength="2"
            :value="startTime.seconds"
            placeholder="0"
            @input="changeTimePart('start', 'seconds', $event)"
          />
          <text class="unit">秒</text>
        </view>
      </view>

      <view class="time-block">
        <text class="block-title">结束时间</text>
        <view class="input-row">
          <input
            class="time-input"
            type="number"
            maxlength="3"
            :value="endTime.minutes"
            placeholder="0"
            @input="changeTimePart('end', 'minutes', $event)"
          />
          <text class="unit">分</text>
          <input
            class="time-input seconds-input"
            type="number"
            maxlength="2"
            :value="endTime.seconds"
            placeholder="0"
            @input="changeTimePart('end', 'seconds', $event)"
          />
          <text class="unit">秒</text>
        </view>
      </view>
    </view>

    <view class="result-panel" :class="{ error: Boolean(errorText) }">
      <text class="result-label">区间用时</text>
      <text class="result-value">{{ resultText }}</text>
      <text v-if="errorText" class="error-text">{{ errorText }}</text>
    </view>

    <view class="action-row">
      <button class="secondary-btn" @tap="swapTimes">交换时间</button>
      <button class="ghost-btn" @tap="clearTimes">清空</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { calcTimeDiff, formatDuration, timePartsToSeconds } from '../../utils/time.js'

const emptyTime = {
  minutes: '',
  seconds: ''
}

const startTime = ref({ ...emptyTime })
const endTime = ref({ ...emptyTime })

const hasStartInput = computed(() => hasTimeInput(startTime.value))
const hasEndInput = computed(() => hasTimeInput(endTime.value))
const startSeconds = computed(() => timePartsToSeconds(startTime.value.minutes, startTime.value.seconds))
const endSeconds = computed(() => timePartsToSeconds(endTime.value.minutes, endTime.value.seconds))
const diffResult = computed(() => calcTimeDiff(startSeconds.value, endSeconds.value))
const errorText = computed(() => {
  if (!hasStartInput.value || !hasEndInput.value) return ''
  return diffResult.value.ok ? '' : diffResult.value.error
})
const resultText = computed(() => {
  if (!hasStartInput.value || !hasEndInput.value) return '0分0秒'
  if (!diffResult.value.ok) return '--'
  return formatDuration(diffResult.value.totalSeconds)
})

function hasTimeInput(time) {
  return String(time.minutes || '').length > 0 || String(time.seconds || '').length > 0
}

function normalizeNumber(value, maxValue) {
  const text = String(value || '').replace(/[^\d]/g, '')
  if (!text) return ''
  const number = Math.max(0, Math.floor(Number(text) || 0))
  return String(Math.min(number, maxValue))
}

function changeTimePart(group, part, event) {
  const target = group === 'start' ? startTime.value : endTime.value
  const maxValue = part === 'seconds' ? 59 : 999
  target[part] = normalizeNumber(event.detail.value, maxValue)
}

function swapTimes() {
  const nextStart = { ...endTime.value }
  const nextEnd = { ...startTime.value }
  startTime.value = nextStart
  endTime.value = nextEnd
}

function clearTimes() {
  startTime.value = { ...emptyTime }
  endTime.value = { ...emptyTime }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 34rpx 56rpx;
  background: #f7f4ea;
  box-sizing: border-box;
}

.header {
  margin-bottom: 30rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  line-height: 1.25;
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

.time-section {
  padding: 0 28rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 22rpx rgba(31, 41, 55, 0.06);
}

.time-block {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.time-block:last-child {
  border-bottom: none;
}

.block-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 650;
  color: #172121;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.time-input {
  width: 144rpx;
  height: 78rpx;
  padding: 0 18rpx;
  border: 1rpx solid #d6cbb8;
  border-radius: 12rpx;
  background: #fbfaf4;
  text-align: center;
  font-size: 30rpx;
  font-weight: 650;
  color: #172121;
  box-sizing: border-box;
}

.seconds-input {
  width: 126rpx;
}

.unit {
  flex-shrink: 0;
  font-size: 25rpx;
  color: #64706d;
}

.result-panel {
  margin-top: 28rpx;
  padding: 34rpx 30rpx;
  border-radius: 18rpx;
  background: #0f5c5c;
  box-shadow: 0 16rpx 34rpx rgba(15, 92, 92, 0.18);
}

.result-panel.error {
  background: #7a570f;
}

.result-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.72);
}

.result-value {
  display: block;
  margin-top: 16rpx;
  font-size: 50rpx;
  line-height: 1.15;
  font-weight: 750;
  color: #ffffff;
}

.error-text {
  display: block;
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.45;
  color: #fff4d6;
}

.action-row {
  display: flex;
  gap: 18rpx;
  margin-top: 28rpx;
}

.secondary-btn,
.ghost-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  margin: 0;
  padding: 0;
  border-radius: 14rpx;
  font-size: 27rpx;
  font-weight: 650;
}

.secondary-btn {
  background: #ffffff;
  border: 1rpx solid #0f5c5c;
  color: #0f5c5c;
}

.ghost-btn {
  background: #f6e8c8;
  color: #7a570f;
}

button::after {
  border: none;
}
</style>
