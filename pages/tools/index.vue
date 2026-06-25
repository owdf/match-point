<template>
  <view class="app-page tools-page">
    <view class="app-topbar">
      <view>
        <text class="app-title">工具</text>
        <text class="app-subtitle">离线训练辅助与本地数据管理</text>
      </view>
    </view>

    <view class="app-section">
      <view class="app-list">
        <view
          v-for="item in tools"
          :key="item.title"
          class="app-list-item"
          @tap="openTool(item)"
        >
          <view class="tool-icon" :class="{ gold: item.accent === 'gold' }">
            <image class="tool-icon-img" :src="item.iconPath" mode="aspectFit" />
          </view>
          <view class="app-row-main">
            <text class="app-row-title">{{ item.title }}</text>
            <text class="app-row-desc">{{ item.desc }}</text>
          </view>
          <text class="app-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="app-bottom-space"></view>
  </view>
</template>

<script setup>
const tools = [
  {
    title: '时间计算',
    desc: '计算训练节点之间的时间差',
    url: '/pages/tools/time-calc',
    iconPath: '/static/tools/time.png'
  },
  {
    title: '赛前检查',
    desc: '正式训练或比赛前快速确认设备与材料',
    url: '/pages/check/precheck',
    iconPath: '/static/tools/precheck.png'
  },
  {
    title: '数据备份',
    desc: '导出或恢复本地训练数据',
    url: '/pages/settings/backup',
    iconPath: '/static/tools/backup.png',
    accent: 'gold'
  },
  {
    title: '隐私政策',
    desc: '查看本地数据与权限使用说明',
    type: 'privacy',
    iconPath: '/static/tools/privacy.png'
  },
  {
    title: '关于赛点',
    desc: '查看版本与产品定位',
    type: 'about',
    iconPath: '/static/tools/about.png'
  }
]

function openTool(item) {
  if (item.url) {
    uni.navigateTo({ url: item.url })
    return
  }

  if (item.type === 'privacy') {
    uni.showModal({
      title: '隐私政策',
      content: '赛点不提供登录、云同步或后台上传功能。训练模板、记录、赛前检查和备份数据均保存在本机本地存储中。导出图片、复制备份等操作只会在你主动点击后执行。',
      showCancel: false
    })
    return
  }

  uni.showModal({
    title: '关于赛点',
    content: '赛点 1.3.0，面向技能比赛训练的离线计时、标记、评分与复盘工具。',
    showCancel: false
  })
}
</script>

<style scoped>
.tools-page {
  padding-top: 42rpx;
}

.tools-page .app-section {
  margin-top: 24rpx;
}

.tool-icon {
  width: 64rpx;
  height: 64rpx;
  margin-right: 18rpx;
  border-radius: 22rpx;
  background: #e6f0ed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-icon.gold {
  background: #f6e8c8;
}

.tool-icon-img {
  width: 42rpx;
  height: 42rpx;
}
</style>
