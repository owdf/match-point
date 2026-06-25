<template>
  <view class="page">
    <view v-if="training">
      <view class="header">
        <view>
          <text class="page-title">自评打分</text>
          <text class="page-subtitle">按本次训练实际表现填写，各项不得超过满分</text>
        </view>
        <view class="score-box">
          <text class="score-value">{{ totalScore }}</text>
          <text class="score-level">{{ level }}</text>
        </view>
      </view>

      <view class="score-list">
        <view v-for="(item, index) in scores" :key="item.id" class="score-item">
          <view class="score-top">
            <view class="score-info">
              <text class="score-name">{{ item.name }}</text>
              <text class="score-max">满分 {{ item.maxScore }} 分</text>
            </view>
            <input
              class="score-input"
              type="number"
              :value="item.score"
              @input="changeScore(index, $event)"
            />
          </view>

          <view class="reason-block">
            <text class="reason-label">扣分原因</text>
            <view class="reason-list">
              <text
                v-for="reason in getReasonOptions(item.name)"
                :key="reason"
                class="reason-tag"
                :class="{ selected: isReasonSelected(item, reason) }"
                @tap="toggleReason(index, reason)"
              >
                {{ reason }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <view class="notes-section">
        <text class="label">复盘备注</text>
        <textarea
          class="textarea"
          v-model="notes"
          placeholder="记录本次训练中需要重点改进的问题"
          maxlength="300"
        />
      </view>

      <view class="notes-section">
        <text class="label">下次改进计划</text>
        <textarea
          class="textarea plan-textarea"
          v-model="nextPlan"
          placeholder="写下下一次训练重点，例如压缩技术说明、提前检查摄像头"
          maxlength="240"
        />
      </view>

      <button class="primary-btn" @tap="saveScore">保存并生成报告</button>
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
import {
  getCurrentTraining,
  saveCurrentTraining,
  saveTrainingRecord
} from '../../utils/storage.js'
import { generateTrainingReport, getScoreLevel, getScoreReasonOptions } from '../../utils/report.js'

const training = ref(null)
const scores = ref([])
const notes = ref('')
const nextPlan = ref('')

const totalScore = computed(() => {
  return scores.value.reduce((sum, item) => sum + (Number(item.score) || 0), 0)
})

const level = computed(() => getScoreLevel(totalScore.value))

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function normalizeScoreItem(item) {
  return {
    ...item,
    score: Number(item.score) || 0,
    reasons: Array.isArray(item.reasons) ? item.reasons : []
  }
}

function refresh() {
  const current = getCurrentTraining()
  training.value = current
  scores.value = current ? clone(current.scores || []).map(normalizeScoreItem) : []
  notes.value = current ? current.notes || '' : ''
  nextPlan.value = current ? current.nextPlan || '' : ''
}

function getReasonOptions(scoreName) {
  return getScoreReasonOptions(scoreName)
}

function isReasonSelected(item, reason) {
  return Array.isArray(item.reasons) && item.reasons.includes(reason)
}

function toggleReason(index, reason) {
  const item = scores.value[index]
  if (!item) return
  const reasons = Array.isArray(item.reasons) ? [...item.reasons] : []
  const reasonIndex = reasons.indexOf(reason)
  if (reasonIndex >= 0) {
    reasons.splice(reasonIndex, 1)
  } else {
    reasons.push(reason)
  }
  item.reasons = reasons
}

function changeScore(index, event) {
  const item = scores.value[index]
  if (!item) return
  let value = Number(event.detail.value)
  if (Number.isNaN(value) || value < 0) value = 0
  if (value > Number(item.maxScore)) {
    value = Number(item.maxScore)
    uni.showToast({ title: '不能超过满分', icon: 'none' })
  }
  item.score = value
}

function saveScore() {
  if (!training.value) return
  const now = new Date().toISOString()
  const nextRecord = {
    ...training.value,
    endedAt: training.value.endedAt || now,
    scores: scores.value.map((item) => ({
      ...item,
      score: Math.min(Number(item.score) || 0, Number(item.maxScore) || 0),
      reasons: Array.isArray(item.reasons) ? item.reasons : []
    })),
    totalScore: totalScore.value,
    level: level.value,
    notes: String(notes.value || '').trim(),
    nextPlan: String(nextPlan.value || '').trim(),
    createdAt: training.value.createdAt || now
  }
  nextRecord.report = generateTrainingReport(nextRecord)
  const saved = saveTrainingRecord(nextRecord)
  saveCurrentTraining(saved)
  uni.redirectTo({
    url: `/pages/training/report?id=${encodeURIComponent(saved.id)}`
  })
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 28rpx;
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

.score-box {
  width: 144rpx;
  padding: 18rpx 0;
  border: 1rpx solid #e4ded0;
  border-radius: 12rpx;
  background: #ffffff;
  text-align: center;
}

.score-value {
  display: block;
  font-size: 38rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #0f5c5c;
}

.score-level {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #64706d;
}

.score-list {
  padding: 0 26rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 22rpx rgba(31, 41, 55, 0.06);
}

.score-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eee8dc;
}

.score-item:last-child {
  border-bottom: none;
}

.score-top {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.score-info {
  flex: 1;
  min-width: 0;
}

.score-name {
  display: block;
  font-size: 28rpx;
  font-weight: 650;
  color: #172121;
}

.score-max {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #64706d;
}

.score-input {
  width: 124rpx;
  height: 68rpx;
  padding: 0 14rpx;
  border: 1rpx solid #d6cbb8;
  border-radius: 10rpx;
  background: #fbfaf4;
  text-align: center;
  font-size: 28rpx;
  color: #172121;
  box-sizing: border-box;
}

.reason-block {
  margin-top: 20rpx;
}

.reason-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 23rpx;
  color: #9aa3a0;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.reason-tag {
  height: 46rpx;
  line-height: 46rpx;
  padding: 0 16rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 999rpx;
  background: #fbfaf4;
  font-size: 22rpx;
  color: #64706d;
}

.reason-tag.selected {
  border-color: #0f5c5c;
  background: #e6f0ed;
  color: #0f5c5c;
  font-weight: 600;
}

.notes-section {
  margin-top: 30rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: #172121;
}

.textarea {
  width: 100%;
  min-height: 180rpx;
  padding: 20rpx;
  border: 1rpx solid #d6cbb8;
  border-radius: 14rpx;
  background: #ffffff;
  font-size: 26rpx;
  line-height: 1.5;
  color: #172121;
  box-sizing: border-box;
}

.plan-textarea {
  min-height: 150rpx;
}

.primary-btn {
  height: 84rpx;
  line-height: 84rpx;
  margin: 42rpx 0 0;
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
