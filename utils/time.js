export function minutesToSeconds(minutes) {
  const value = Number(minutes) || 0
  return Math.max(0, Math.round(value * 60))
}

export function timePartsToSeconds(minutes, seconds) {
  const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0))
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  return safeMinutes * 60 + safeSeconds
}

export function secondsToTimeParts(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  return {
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60
  }
}

export function calcTimeDiff(startSeconds, endSeconds) {
  const safeStartSeconds = Math.max(0, Math.floor(Number(startSeconds) || 0))
  const safeEndSeconds = Math.max(0, Math.floor(Number(endSeconds) || 0))

  if (safeEndSeconds < safeStartSeconds) {
    return {
      ok: false,
      totalSeconds: 0,
      minutes: 0,
      seconds: 0,
      error: '结束时间应大于开始时间'
    }
  }

  const totalSeconds = safeEndSeconds - safeStartSeconds
  return {
    ok: true,
    totalSeconds,
    ...secondsToTimeParts(totalSeconds),
    error: ''
  }
}

export function formatDurationLabel(totalSeconds, positiveText = '超出', negativeText = '节省') {
  const value = Math.floor(Number(totalSeconds) || 0)
  if (value > 0) return `${positiveText}${formatDuration(value)}`
  if (value < 0) return `${negativeText}${formatDuration(Math.abs(value))}`
  return '持平'
}

export function formatMMSS(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0')
  const restSeconds = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${restSeconds}`
}

export function formatMMSSMS(milliseconds) {
  const safeMilliseconds = Math.max(0, Math.floor(Number(milliseconds) || 0))
  const totalSeconds = Math.floor(safeMilliseconds / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  const ms = String(safeMilliseconds % 1000).padStart(3, '0')
  return `${minutes}:${seconds}.${ms}`
}

export function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const { minutes, seconds: restSeconds } = secondsToTimeParts(safeSeconds)
  return `${minutes}分${restSeconds}秒`
}

export function formatDurationWithMs(milliseconds) {
  const safeMilliseconds = Math.max(0, Math.floor(Number(milliseconds) || 0))
  const totalSeconds = Math.floor(safeMilliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const ms = safeMilliseconds % 1000
  if (minutes <= 0) return `${seconds}秒${String(ms).padStart(3, '0')}毫秒`
  return `${minutes}分${seconds}秒${String(ms).padStart(3, '0')}毫秒`
}

export function getFormattedDate(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
