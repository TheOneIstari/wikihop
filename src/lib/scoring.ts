export const scoreRun = (clicks: number, seconds: number) => Math.max(0, 1000 - clicks * 60 - Math.floor(seconds / 3))
export const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
