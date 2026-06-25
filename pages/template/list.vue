<template>
  <view class="app-page template-page">
    <view class="app-topbar">
      <view>
        <text class="app-title">训练</text>
        <text class="app-subtitle">选择模板，开始一轮计时与复盘</text>
      </view>
      <button class="create-btn" @tap="createTemplate">新建</button>
    </view>

    <view class="template-list app-list">
      <view
        v-for="item in templates"
        :key="item.id"
        class="template-item app-list-item"
        @tap="startTraining(item)"
      >
        <view class="app-row-main">
          <view class="title-line">
            <text class="app-row-title template-name">{{ item.name }}</text>
            <text class="app-chip" :class="{ 'app-chip-gold': !item.isDefault }">{{ item.isDefault ? '内置' : '自定义' }}</text>
          </view>
          <text class="app-row-desc">
            总时长{{ item.totalMinutes }}分钟 · 目标{{ item.targetMinutes }}分钟 · {{ item.stages.length }}个阶段
          </text>
        </view>
        <view class="row-actions">
          <text
            v-if="!item.isDefault"
            class="edit-link"
            @tap.stop="editTemplate(item)"
          >编辑</text>
          <text class="app-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="app-bottom-space"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getTemplates, initDefaultTemplates } from '../../utils/storage.js'

const templates = ref([])

function refresh() {
  initDefaultTemplates()
  templates.value = getTemplates()
}

function startTraining(item) {
  uni.navigateTo({
    url: `/pages/training/timer?templateId=${encodeURIComponent(item.id)}`
  })
}

function createTemplate() {
  uni.navigateTo({
    url: '/pages/template/edit'
  })
}

function editTemplate(item) {
  uni.navigateTo({
    url: `/pages/template/edit?id=${encodeURIComponent(item.id)}`
  })
}

refresh()
onShow(refresh)
</script>

<style scoped>
.template-page {
  padding-top: 42rpx;
}

.create-btn {
  width: 120rpx;
  height: 62rpx;
  line-height: 62rpx;
  border-radius: 999rpx;
  background: #0f5c5c;
  color: #ffffff;
  font-size: 25rpx;
}

.template-item {
  min-height: 132rpx;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.template-name {
  max-width: 420rpx;
}

.row-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.edit-link {
  margin-right: 10rpx;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: #e6f0ed;
  color: #073f3f;
  font-size: 23rpx;
  font-weight: 650;
}
</style>
