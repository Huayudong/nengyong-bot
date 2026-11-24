/** The timezone the app tells time in, whatever the computer's own is: what Bots take as now, routines, every time shown. */
export const TIMEZONE = 'Asia/Shanghai'

/** 8:05 on TIMEZONE's clock. */
export const clockLabel = (at: number) =>
  new Date(at).toLocaleTimeString('zh-CN', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })

/** 0–23: the hour on TIMEZONE's clock. */
export const clockHour = (at: number) =>
  Number(new Date(at).toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: 'numeric', hourCycle: 'h23' }))

/** Days since 1970-01-01 on TIMEZONE's calendar, so two moments compare by the date shown. */
export const calendarDay = (at: number) =>
  Date.parse(new Date(at).toLocaleDateString('en-CA', { timeZone: TIMEZONE })) / 86_400_000
