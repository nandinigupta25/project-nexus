import { useQuery } from '@tanstack/react-query'
import { activityAPI } from '../api/services'
import { format } from 'date-fns'
import { Activity, User } from 'lucide-react'

const ACTIVITY_ICONS = {
  USER_LOGIN: '🔐', USER_LOGOUT: '👋',
  PROJECT_CREATED: '📁', PROJECT_UPDATED: '✏️', PROJECT_DELETED: '🗑️', PROJECT_ARCHIVED: '📦',
  TASK_CREATED: '✅', TASK_UPDATED: '🔄', TASK_DELETED: '❌', TASK_ASSIGNED: '👤',
  TASK_STATUS_CHANGED: '🔀', COMMENT_ADDED: '💬',
  TEAM_CREATED: '👥', TEAM_MEMBER_ADDED: '➕', TEAM_MEMBER_REMOVED: '➖',
  PROFILE_UPDATED: '📝', PASSWORD_CHANGED: '🔑',
}

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-me'],
    queryFn: () => activityAPI.getMine({ page: 0, size: 50 }),
  })

  const logs = data?.data?.content || []

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">Your recent actions and system events</p>
      </div>

      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700" />
            <div className="space-y-0">
              {logs.map((log, idx) => (
                <div key={log.id} className="flex gap-4 relative pb-5">
                  <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-lg z-10 flex-shrink-0">
                    {ACTIVITY_ICONS[log.activityType] || '📌'}
                  </div>
                  <div className="flex-1 pt-1.5 min-w-0">
                    <p className="text-sm text-slate-200">{log.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy · HH:mm') : ''}
                      {log.entityType && <span className="ml-2 text-slate-600">· {log.entityType}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
