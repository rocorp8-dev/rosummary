export type MeetingStatus = 'recording' | 'processing' | 'ready' | 'error'

export interface Meeting {
  id: string
  user_id: string
  title: string
  date: string
  duration_seconds: number
  audio_url: string | null
  transcript: string | null
  summary: string | null
  action_items: ActionItem[]
  participants: string[]
  status: MeetingStatus
  created_at: string
  updated_at: string
}

export interface ActionItem {
  id: string
  text: string
  done: boolean
  assignee?: string
}

export interface MeetingMessage {
  id: string
  meeting_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
