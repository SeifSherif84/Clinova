export interface WorkingHour {
  id: number
  day: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

export interface CreateWorkingHourRequest {
  day: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

export interface UpdateWorkingHourRequest {
  startTime: string
  endTime: string
  slotDurationMinutes: number
}