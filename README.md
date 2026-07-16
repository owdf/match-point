<div align="center">

<img src="static/logo.png" alt="Match Point logo" width="104" />

# Match Point 赛点

**技能比赛训练的离线计时、标记、评分与复盘工具。**

[![CI](https://github.com/owdf/match-point/actions/workflows/ci.yml/badge.svg)](https://github.com/owdf/match-point/actions/workflows/ci.yml)
[![Pages](https://github.com/owdf/match-point/actions/workflows/pages.yml/badge.svg)](https://owdf.github.io/match-point/)
[![Release](https://img.shields.io/github/v/release/owdf/match-point?display_name=tag)](https://github.com/owdf/match-point/releases/latest)
[![License](https://img.shields.io/github/license/owdf/match-point)](LICENSE)

[立即在线使用](https://owdf.github.io/match-point/) · [English](README_EN.md) · [报告问题](https://github.com/owdf/match-point/issues/new)

</div>

![Match Point 首页真实截图](docs/home.png)

## 为什么做它

技能比赛训练不是单纯倒计时。选手还要控制每个阶段的节奏、记录卡顿和设备异常、完成赛前检查、按评分项自评，并在下一轮训练前找到最值得改的地方。

纸笔和普通计时器会把这些信息拆散。Match Point 把完整训练闭环放进一个本地优先工具：

> 选模板 → 计时 → 标记 → 检查 → 评分 → 复盘 → 备份

无需账号，项目代码不调用 AI 或业务服务器。首次打开在线版需要网络；资源缓存完成后，可作为 PWA 离线使用。训练数据保存在当前浏览器或 App 的本地存储中。

## 直接使用

### 安装 PWA

1. 在 Chrome、Edge 或 Android 浏览器中打开 [Match Point 在线版](https://owdf.github.io/match-point/)；
2. 使用地址栏的“安装”按钮，或浏览器菜单中的“添加到主屏幕”；
3. 至少完整打开一次应用，随后即可离线启动。

PWA 是当前推荐版本：无需注册、无需 APK、手机和电脑都能用。

### 下载离线包

[GitHub Releases](https://github.com/owdf/match-point/releases/latest) 提供 `MatchPoint-PWA.zip` 和 `SHA256SUMS.txt`。解压后的静态文件需要通过 HTTP 服务器打开，Service Worker 不能在 `file://` 下运行：

```powershell
npx serve .
```

### Android 原生包

仓库保留 uni-app Android 配置和完整尺寸图标，可通过 HBuilderX 构建。公开 Release 暂不冒充“正式 APK”：稳定的 Android 更新必须使用长期保存的私有签名密钥，一次性或公开密钥会破坏后续安全更新。当前用户请优先安装 PWA。

## 核心功能

- 4 套内置训练模板，并支持自定义总时长、目标时间和训练阶段；
- 毫秒级总计时与阶段计时，支持暂停、前后切换、全屏显示和后台补算；
- 快捷标记讲解、演示、设备异常、表达卡顿和超时风险；
- 训练草稿自动保存，意外退出后可恢复；
- 训练清单、7 项自评和扣分原因；
- 自动分析最长标记区间、阶段偏差、常见低分项和超时阶段；
- 复盘报告文本与图片导出；
- 5 类 29 项赛前检查；
- JSON 备份、导入恢复和本地数据清理；
- 无账号、无云端数据库、无遥测配置。

## 数据与隐私

| 数据 | 存储位置 |
|---|---|
| 模板 | 当前浏览器或 App 的本地 Storage |
| 训练记录 | 当前浏览器或 App 的本地 Storage |
| 未完成草稿 | 当前浏览器或 App 的本地 Storage |
| 赛前检查 | 当前浏览器或 App 的本地 Storage |
| 设置 | 当前浏览器或 App 的本地 Storage |

清除站点数据、浏览器数据或卸载 App 会删除本地记录。换设备或清理数据前，请在“工具 → 数据备份”中导出 JSON。

备份导入会替换模板、记录、设置、检查状态和当前草稿。v1.4.0 会校正无效的负时长、超范围分数和空阶段，避免损坏统计。

## 本地开发

要求 Node.js 22 或更高版本。

```powershell
git clone https://github.com/owdf/match-point.git
cd match-point
npm ci
npm run dev:h5
```

验证与构建：

```powershell
npm test
npm run build:h5
npm run verify:build
```

构建结果位于 `dist/build/h5`。`npm run verify:build` 会检查入口、Web App Manifest、Service Worker 和 PWA 安装元数据是否齐全。

重新生成 Android/iOS 图标：

```powershell
.\scripts\generate-icons.ps1
```

## 项目结构

```text
pages/                      页面与训练流程
utils/storage.js            本地数据、备份与统计
utils/report.js             阶段偏差、标记和复盘分析
utils/time.js               时间换算与格式化
utils/export.js             报告文本和图片导出
public/                     PWA manifest 与 Service Worker
test/                       Node.js 单元和回归测试
unpackage/res/icons/        原生应用完整尺寸图标
.github/workflows/          CI、Pages 部署和 Release
```

## 当前限制

- 数据不会自动跨设备同步；需要手动导出和导入 JSON；
- 浏览器无痕模式或主动清理站点数据会删除记录；
- PWA 版受浏览器后台调度限制，但返回页面时会按时间戳补算离开时长；
- 报告图片保存能力取决于平台，失败时可复制纯文本报告；
- Android 正式 APK 尚未发布，原因是项目还没有由维护者保管的长期签名密钥。

## 贡献与许可证

提交改动前请运行 `npm run check`。Bug 报告请包含平台、浏览器或 HBuilderX 版本、复现步骤，以及脱敏后的备份样例（如问题与数据有关）。

[MIT License](LICENSE) © 2026 Dongfang Wang.
