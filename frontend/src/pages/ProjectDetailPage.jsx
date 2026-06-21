import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectAPI, taskAPI, commentAPI } from '../api/services'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Kanban, Calendar, Users, CheckSquare,
  Clock, Edit, Archive, Trash2, Plus, MessageSquare,
  Flag, MoreVertical, Loader2, Send, X
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_STYLES = {
  TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress',
  REVIEW: 'badge-review', COMPLETED: 'badge-completed',
}

function CommentSection({ taskId }) {
  const [text, setText] = useState('')
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentAPI.getByTask(taskId, { size: 50 }),
  })

  const mutation = useMutation({
    mutationFn: () => commentAPI.add(taskId, { content: text }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', taskId] }); setText('') },
  })

  const comments = data?.data?.content || []

  return (
    <div className="mt-4 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white flex-shrink-0 mt-0.5">
            {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
          </div>
          <div className="flex-1 bg-slate-700/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-300">{c.author?.firstName} {c.author?.lastName}</span>
              <span className="text-xs text-slate-600">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, HH:mm') : ''}</span>
            </div>
            <p className="text-sm text-slate-300">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && text.trim() && mutation.mutate()}
          placeholder="Add a comment..." className="input flex-1 text-sm" />
        <button onClick={() => text.trim() && mutation.mutate()} disabled={!text.trim() || mutation.isPending}
          className="btn-primary px-3">
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

function TaskItem({ task }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-slate-700/60 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(p => !p)}
        className="flex items-center gap-3 p-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
      >
        <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
          task.priority === 'CRITICAL' ? 'bg-red-400' :
          task.priority === 'HIGH' ? 'bg-amber-400' :
          task.priority === 'MEDIUM' ? 'bg-blue-400' : 'bg-slate-400'
        )} />
        <span className="flex-1 text-sm text-slate-200 truncate">{task.title}</span>
        {task.assignee && (
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white flex-shrink-0">
            {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
          </div>
        )}
        {task.dueDate && (
          <span className={clsx('text-xs hidden sm:block', task.overdue ? 'text-red-400' : 'text-slate-500')}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        <span className={STATUS_STYLES[task.status]}>{task.status?.replace('_', ' ')}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 bg-slate-800/30">
          {task.description && <p className="text-sm text-slate-400 mb-3">{task.description}</p>}
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
            {task.estimatedHours && <span><Clock size={11} className="inline mr-1" />{task.estimatedHours}h estimated</span>}
            <span><MessageSquare size={11} className="inline mr-1" />{task.commentCount} comments</span>
          </div>
          <CommentSection taskId={task.id} />
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('tasks')

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.getById(id),
  })

  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => taskAPI.getByProject(id, { size: 100 }),
  })

  const archiveMutation = useMutation({
    mutationFn: () => projectAPI.archive(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['project', id] }); toast.success('Project archived') },
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectAPI.delete(id),
    onSuccess: () => { navigate('/projects'); toast.success('Project deleted') },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  const project = projectData?.data
  const tasks = tasksData?.data?.content || []

  const tasksByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    REVIEW: tasks.filter(t => t.status === 'REVIEW'),
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{project?.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {project?.owner?.firstName} {project?.owner?.lastName} ·{' '}
              {project?.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/kanban/${id}`} className="btn-secondary text-sm">
            <Kanban size={16} /> Kanban Board
          </Link>
          <button onClick={() => archiveMutation.mutate()} className="btn-ghost p-2 text-amber-400" title="Archive">
            <Archive size={16} />
          </button>
          <button onClick={() => { if (confirm('Delete project?')) deleteMutation.mutate() }}
            className="btn-ghost p-2 text-red-400" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Project overview card */}
      <div className="card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <span className={clsx('badge',
              project?.status === 'ACTIVE' ? 'badge-active' :
              project?.status === 'PLANNING' ? 'badge-planning' :
              project?.status === 'ON_HOLD' ? 'badge-on-hold' :
              project?.status === 'COMPLETED' ? 'badge-completed' : 'badge-archived'
            )}>{project?.status?.replace('_', ' ')}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority</p>
            <span className={clsx('badge',
              project?.priority === 'CRITICAL' ? 'badge-critical' :
              project?.priority === 'HIGH' ? 'badge-high' :
              project?.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
            )}>{project?.priority}</span>
          </div>
          {project?.startDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Start Date</p>
              <p className="text-sm text-slate-300">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
            </div>
          )}
          {project?.endDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">End Date</p>
              <p className="text-sm text-slate-300">{format(new Date(project.endDate), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {project?.description && (
          <p className="text-sm text-slate-400 mb-6">{project.description}</p>
        )}

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Overall Progress</span>
            <span className="font-semibold text-slate-200">{project?.progress}%</span>
          </div>
          <div className="progress-bar h-2.5">
            <div className="progress-fill" style={{ width: `${project?.progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tasks', value: project?.totalTasks, icon: CheckSquare, color: 'text-indigo-400' },
            { label: 'Completed', value: project?.completedTasks, icon: CheckSquare, color: 'text-emerald-400' },
            { label: 'Pending', value: project?.pendingTasks, icon: Clock, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Icon size={20} className={clsx('mx-auto mb-1', color)} />
              <p className="text-2xl font-bold text-slate-100">{value ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Team members */}
        {project?.members && project.members.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Team Members</p>
            <div className="flex flex-wrap gap-2">
              {project.members.map(m => (
                <div key={m.id} className="flex items-center gap-2 bg-slate-700/40 rounded-full px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white">
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                  <span className="text-xs text-slate-300">{m.firstName} {m.lastName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {['tasks', 'todo', 'in_progress', 'review', 'completed'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}>
            {tab === 'tasks' ? `All Tasks (${tasks.length})` :
             tab === 'todo' ? `To Do (${tasksByStatus.TODO?.length})` :
             tab === 'in_progress' ? `In Progress (${tasksByStatus.IN_PROGRESS?.length})` :
             tab === 'review' ? `Review (${tasksByStatus.REVIEW?.length})` :
             `Completed (${tasksByStatus.COMPLETED?.length})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {(activeTab === 'tasks' ? tasks :
          activeTab === 'todo' ? tasksByStatus.TODO :
          activeTab === 'in_progress' ? tasksByStatus.IN_PROGRESS :
          activeTab === 'review' ? tasksByStatus.REVIEW :
          tasksByStatus.COMPLETED
        ).map(task => <TaskItem key={task.id} task={task} />)}

        {tasks.length === 0 && (
          <div className="card p-12 text-center">
            <CheckSquare size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No tasks yet</p>
            <p className="text-sm text-slate-600 mt-1">Create your first task to track progress</p>
          </div>
        )}
      </div>
    </div>
  )
}
