<template>
  <view class="page">
    <view class="header">
      <text class="page-title">数据备份</text>
      <text class="page-subtitle">导出或恢复本地训练数据，全程不联网</text>
    </view>

    <view class="section">
      <text class="section-title">导出数据</text>
      <text class="section-desc">生成 JSON 备份文本，可复制后保存到你自己的文档中。</text>
      <textarea
        class="textarea backup-text"
        :value="backupText"
        disabled
        placeholder="点击下方按钮生成备份 JSON"
      />
      <view class="button-row">
        <button class="primary-btn" @tap="generateBackup">生成备份</button>
        <button class="secondary-btn" @tap="copyBackup">复制 JSON</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">恢复数据</text>
      <text class="section-desc">粘贴此前导出的 JSON。导入会覆盖当前本地模板、记录和赛前检查状态。</text>
      <textarea
        class="textarea"
        v-model="importText"
        placeholder="在此粘贴备份 JSON"
        maxlength="-1"
      />
      <button class="gold-btn" @tap="confirmImport">粘贴 JSON 并恢复</button>
    </view>

    <view class="section danger-section">
      <text class="section-title">清空本地数据</text>
      <text class="section-desc">将清空训练记录、模板、当前训练草稿和赛前检查状态。默认模板会重新初始化。</text>
      <button class="danger-btn" @tap="confirmClear">清空本地数据</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import {
  clearAllLocalData,
  exportLocalBackupText,
  importLocalBackupData
} from '../../utils/storage.js'

const backupText = ref('')
const importText = ref('')

function generateBackup() {
  backupText.value = exportLocalBackupText()
  uni.showToast({ title: '已生成备份', icon: 'success' })
}

function copyBackup() {
  if (!backupText.value) {
    generateBackup()
  }
  uni.setClipboardData({
    data: backupText.value,
    success() {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

function confirmImport() {
  const text = String(importText.value || '').trim()
  if (!text) {
    uni.showToast({ title: '请先粘贴备份 JSON', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认恢复',
    content: '导入数据可能覆盖当前本地数据，请确认是否继续。',
    success(res) {
      if (!res.confirm) return
      try {
        const result = importLocalBackupData(text)
        uni.showToast({ title: `已恢复${result.recordCount}条记录`, icon: 'success' })
        backupText.value = ''
      } catch (error) {
        uni.showToast({ title: error.message || '备份 JSON 无效', icon: 'none' })
      }
    }
  })
}

function confirmClear() {
  uni.showModal({
    title: '清空数据',
    content: '此操作会删除当前本地训练数据，且无法自动恢复。确认继续？',
    success(first) {
      if (!first.confirm) return
      uni.showModal({
        title: '再次确认',
        content: '请再次确认：清空后只能通过你手动保存的备份 JSON 恢复。',
        success(second) {
          if (!second.confirm) return
          clearAllLocalData()
          backupText.value = ''
          importText.value = ''
          uni.showToast({ title: '已清空', icon: 'success' })
        }
      })
    }
  })
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

.section {
  margin-top: 28rpx;
  padding: 28rpx;
  border: 1rpx solid #e4ded0;
  border-radius: 18rpx;
  background: #ffffff;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 650;
  color: #172121;
}

.section-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.55;
  color: #64706d;
}

.textarea {
  width: 100%;
  min-height: 260rpx;
  margin-top: 22rpx;
  padding: 20rpx;
  border: 1rpx solid #d6cbb8;
  border-radius: 14rpx;
  background: #fbfaf4;
  font-size: 24rpx;
  line-height: 1.55;
  color: #172121;
  box-sizing: border-box;
}

.backup-text {
  color: #64706d;
}

.button-row {
  display: flex;
  gap: 18rpx;
  margin-top: 22rpx;
}

.primary-btn,
.secondary-btn,
.gold-btn,
.danger-btn {
  height: 84rpx;
  line-height: 84rpx;
  margin: 0;
  padding: 0;
  border-radius: 14rpx;
  font-size: 27rpx;
  font-weight: 650;
}

.primary-btn,
.secondary-btn {
  flex: 1;
}

.primary-btn {
  background: #0f5c5c;
  color: #ffffff;
}

.secondary-btn {
  border: 1rpx solid #0f5c5c;
  background: #ffffff;
  color: #0f5c5c;
}

.gold-btn {
  width: 100%;
  margin-top: 24rpx;
  border: 1rpx solid #c99a2e;
  background: #f6e8c8;
  color: #7a570f;
}

.danger-section {
  border-color: rgba(220, 38, 38, 0.24);
}

.danger-btn {
  width: 100%;
  margin-top: 24rpx;
  border: 1rpx solid rgba(220, 38, 38, 0.35);
  background: #ffffff;
  color: #dc2626;
}

button::after {
  border: none;
}
</style>
