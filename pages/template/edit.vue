<template>
  <view class="page">
    <view class="header">
      <text class="page-title">{{ form.id ? '编辑模板' : '新建模板' }}</text>
      <text class="page-subtitle">设置训练总时长、目标完成时间和阶段安排</text>
    </view>

    <view class="form-section">
      <view class="field">
        <text class="label">模板名称</text>
        <input class="input" v-model="form.name" placeholder="请输入模板名称" />
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">总时长（分钟）</text>
          <input class="input" type="number" v-model="form.totalMinutes" placeholder="60" />
        </view>
        <view class="field">
          <text class="label">目标完成时间（分钟）</text>
          <input class="input" type="number" v-model="form.targetMinutes" placeholder="55" />
        </view>
      </view>
    </view>

    <view class="stage-head">
      <view>
        <text class="section-title">阶段设置</text>
        <text class="stage-summary">计划合计 {{ stageTotal }} 分钟</text>
      </view>
      <button class="outline-btn" @tap="addStage">添加阶段</button>
    </view>

    <view class="stage-list">
      <view v-for="(stage, index) in form.stages" :key="stage.id" class="stage-row">
        <text class="stage-index">{{ index + 1 }}</text>
        <view class="stage-fields">
          <input class="input stage-name" v-model="stage.name" placeholder="阶段名称" />
          <input class="input stage-minutes" type="number" v-model="stage.minutes" placeholder="分钟" />
        </view>
        <text class="delete-link" @tap="removeStage(index)">删除</text>
      </view>
    </view>

    <button class="primary-btn" @tap="save">保存模板</button>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createEmptyTemplate, getTemplateById, saveTemplate } from '../../utils/storage.js'

const form = ref(createEmptyTemplate())

const stageTotal = computed(() => {
  return form.value.stages.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0)
})

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function addStage() {
  form.value.stages.push({
    id: `stage-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: '',
    minutes: 5
  })
}

function removeStage(index) {
  if (form.value.stages.length <= 1) {
    uni.showToast({ title: '至少保留一个阶段', icon: 'none' })
    return
  }
  form.value.stages.splice(index, 1)
}

function save() {
  const name = String(form.value.name || '').trim()
  const totalMinutes = Number(form.value.totalMinutes)
  const targetMinutes = Number(form.value.targetMinutes)
  const stages = form.value.stages.map((item) => ({
    ...item,
    name: String(item.name || '').trim(),
    minutes: Number(item.minutes)
  }))

  if (!name) {
    uni.showToast({ title: '请填写模板名称', icon: 'none' })
    return
  }
  if (!totalMinutes || totalMinutes <= 0) {
    uni.showToast({ title: '总时长需大于0', icon: 'none' })
    return
  }
  if (!targetMinutes || targetMinutes <= 0 || targetMinutes > totalMinutes) {
    uni.showToast({ title: '目标时间需合理', icon: 'none' })
    return
  }
  if (stages.some((item) => !item.name || !item.minutes || item.minutes <= 0)) {
    uni.showToast({ title: '请完善阶段名称和分钟数', icon: 'none' })
    return
  }

  const saved = saveTemplate({
    ...form.value,
    name,
    totalMinutes,
    targetMinutes,
    stages
  })

  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack({
      fail() {
        uni.redirectTo({ url: `/pages/training/timer?templateId=${encodeURIComponent(saved.id)}` })
      }
    })
  }, 350)
}

onLoad((query) => {
  if (query.id) {
    const template = getTemplateById(decodeURIComponent(query.id))
    if (template) {
      const next = clone(template)
      if (next.isDefault) {
        next.id = ''
        next.name = `${next.name}副本`
        next.isDefault = false
        next.createdAt = ''
      }
      form.value = next
    }
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 32rpx 56rpx;
  background: #f4f7fb;
  box-sizing: border-box;
}

.header {
  margin-bottom: 30rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #66758a;
}

.form-section,
.stage-list {
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.035);
  box-sizing: border-box;
}

.field {
  margin-bottom: 24rpx;
}

.field:last-child {
  margin-bottom: 0;
}

.field-grid {
  display: flex;
  gap: 18rpx;
}

.field-grid .field {
  flex: 1;
  min-width: 0;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #536273;
}

.input {
  height: 76rpx;
  padding: 0 20rpx;
  border: 1rpx solid #d6dee8;
  border-radius: 10rpx;
  background: #f8fafc;
  font-size: 27rpx;
  color: #0f172a;
  box-sizing: border-box;
}

.stage-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 38rpx 0 18rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #0f172a;
}

.stage-summary {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #66758a;
}

.outline-btn {
  width: 172rpx;
  height: 66rpx;
  line-height: 66rpx;
  margin: 0;
  padding: 0;
  border-radius: 10rpx;
  border: 1rpx solid #102a43;
  background: #ffffff;
  color: #102a43;
  font-size: 24rpx;
}

button::after {
  border: none;
}

.stage-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #edf2f7;
}

.stage-row:first-child {
  padding-top: 0;
}

.stage-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.stage-index {
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  margin-right: 18rpx;
  border-radius: 50%;
  background: #f1f5f9;
  text-align: center;
  font-size: 23rpx;
  color: #536273;
}

.stage-fields {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 14rpx;
}

.stage-name {
  flex: 1;
}

.stage-minutes {
  width: 138rpx;
}

.delete-link {
  margin-left: 18rpx;
  font-size: 24rpx;
  color: #8a1f1f;
}

.primary-btn {
  height: 84rpx;
  line-height: 84rpx;
  margin: 42rpx 0 0;
  border-radius: 10rpx;
  background: #102a43;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
