import { getReportExportSummary } from './report.js'

const CANVAS_WIDTH = 750
const CANVAS_HEIGHT = 1280
const PADDING = 56
const PRIMARY = '#0F5C5C'
const GOLD = '#C99A2E'
const BG = '#F7F4EA'
const TEXT = '#172121'
const SECONDARY = '#64706D'
const BORDER = '#E4DED0'
const WHITE = '#FFFFFF'
let currentFontSize = 28

function setTextStyle(ctx, size, color = TEXT, bold = false) {
  currentFontSize = size
  ctx.setFillStyle(color)
  ctx.setFontSize(size)
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
}

function getTextWidth(ctx, text) {
  if (typeof ctx.measureText === 'function') {
    return ctx.measureText(text).width
  }
  return String(text || '').length * currentFontSize
}

function drawLine(ctx, x1, y, x2) {
  ctx.setStrokeStyle(BORDER)
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const source = String(text || '')
  const lines = []
  let line = ''

  for (let index = 0; index < source.length; index += 1) {
    const nextLine = `${line}${source[index]}`
    const width = getTextWidth(ctx, nextLine)
    if (width > maxWidth && line) {
      lines.push(line)
      line = source[index]
      if (lines.length >= maxLines) break
    } else {
      line = nextLine
    }
  }

  if (line && lines.length < maxLines) lines.push(line)

  lines.forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight)
  })

  return y + Math.max(1, lines.length) * lineHeight
}

function drawInfoRow(ctx, label, value, x, y, maxWidth) {
  setTextStyle(ctx, 24, SECONDARY)
  ctx.fillText(label, x, y)
  setTextStyle(ctx, 28, TEXT, true)
  return drawWrappedText(ctx, value, x + 170, y, maxWidth - 170, 38, 2)
}

export function buildReportPlainText(record = {}) {
  const summary = getReportExportSummary(record)
  return [
    '赛点｜训练复盘报告',
    `训练日期：${summary.dateText}`,
    `使用模板：${summary.templateName}`,
    `总用时：${summary.usedText}，${summary.overtimeText}`,
    `总分：${summary.totalScore}，等级：${summary.level}`,
    `主要低分项：${summary.lowText}`,
    `最长标记区间：${summary.markerIntervalText}`,
    `阶段偏差摘要：${summary.stageDeviationText}`,
    `扣分原因：${summary.reasonText}`,
    `下次改进计划：${summary.nextPlan}`
  ].join('\n')
}

export function createReportImage(record = {}, canvasId = 'reportCanvas', component = null) {
  const summary = getReportExportSummary(record)

  return new Promise((resolve, reject) => {
    const ctx = uni.createCanvasContext(canvasId, component)
    if (!ctx) {
      reject(new Error('无法创建画布'))
      return
    }

    ctx.setFillStyle(BG)
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.setFillStyle(WHITE)
    ctx.fillRect(PADDING - 8, 40, CANVAS_WIDTH - PADDING * 2 + 16, CANVAS_HEIGHT - 80)

    ctx.setFillStyle(GOLD)
    ctx.fillRect(PADDING, 70, 88, 8)

    setTextStyle(ctx, 34, PRIMARY, true)
    ctx.fillText('赛点', PADDING, 124)
    setTextStyle(ctx, 46, TEXT, true)
    ctx.fillText('训练复盘报告', PADDING, 184)
    setTextStyle(ctx, 24, SECONDARY)
    ctx.fillText('离线生成 · 数据仅保存在本地', PADDING, 224)

    drawLine(ctx, PADDING, 260, CANVAS_WIDTH - PADDING)

    let y = 314
    y = drawInfoRow(ctx, '训练日期', summary.dateText, PADDING, y, CANVAS_WIDTH - PADDING * 2) + 22
    y = drawInfoRow(ctx, '使用模板', summary.templateName, PADDING, y, CANVAS_WIDTH - PADDING * 2) + 22
    y = drawInfoRow(ctx, '总用时', `${summary.usedText} · ${summary.overtimeText}`, PADDING, y, CANVAS_WIDTH - PADDING * 2) + 22

    ctx.setFillStyle('#E6F0ED')
    ctx.fillRect(PADDING, y + 6, 300, 112)
    ctx.setFillStyle('#F6E8C8')
    ctx.fillRect(PADDING + 324, y + 6, 258, 112)
    setTextStyle(ctx, 24, SECONDARY)
    ctx.fillText('总分', PADDING + 24, y + 46)
    ctx.fillText('等级', PADDING + 348, y + 46)
    setTextStyle(ctx, 42, PRIMARY, true)
    ctx.fillText(String(summary.totalScore), PADDING + 24, y + 96)
    ctx.fillText(summary.level, PADDING + 348, y + 96)
    y += 156

    drawLine(ctx, PADDING, y, CANVAS_WIDTH - PADDING)
    y += 50

    const sections = [
      ['主要低分项', summary.lowText],
      ['最长标记区间', summary.markerIntervalText],
      ['阶段偏差摘要', summary.stageDeviationText],
      ['扣分原因', summary.reasonText],
      ['下次改进计划', summary.nextPlan]
    ]

    sections.forEach(([title, content]) => {
      setTextStyle(ctx, 26, PRIMARY, true)
      ctx.fillText(title, PADDING, y)
      setTextStyle(ctx, 28, TEXT)
      y = drawWrappedText(ctx, content, PADDING, y + 42, CANVAS_WIDTH - PADDING * 2, 40, title === '下次改进计划' ? 4 : 3)
      y += 34
    })

    drawLine(ctx, PADDING, CANVAS_HEIGHT - 120, CANVAS_WIDTH - PADDING)
    setTextStyle(ctx, 22, SECONDARY)
    ctx.fillText('赛点 Match Point · 1.3.0', PADDING, CANVAS_HEIGHT - 76)

    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        destWidth: CANVAS_WIDTH * 2,
        destHeight: CANVAS_HEIGHT * 2,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      }, component)
    })
  })
}

export async function saveReportImage(record = {}, canvasId = 'reportCanvas', component = null) {
  const tempFilePath = await createReportImage(record, canvasId, component)

  return new Promise((resolve) => {
    if (typeof uni.saveImageToPhotosAlbum !== 'function') {
      resolve({ tempFilePath, saved: false, error: '当前平台不支持直接保存图片' })
      return
    }

    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success() {
        resolve({ tempFilePath, saved: true, error: '' })
      },
      fail(error) {
        resolve({ tempFilePath, saved: false, error: error?.errMsg || '保存图片失败' })
      }
    })
  })
}
