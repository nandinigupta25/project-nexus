import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskAPI, projectAPI, userAPI } from '../api/services'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Plus, Search, CheckSquare, Calendar, Flag, User,
  Loader2, X, Filter, Trash2, Edit, MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const schema = z.object({
  title: z.string().min(3, 'At least 3 characters'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
})

const STATUS_STYLES = {
  TODO: 'badge-todo',
  IN_PROGRESS: 'badge-in-progress',
  REVIEW: 'badge-review',
  COMPLETED: 'badge-completed',
}
const PRIORITY_STYLES = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
}
const PRIORITY_DOT = {
  LOW: 'bg-slate-400', MEDIUM: 'bg-blue-400', HIGH: 'bg-amber-400', CRITICAL: 'bg-red-400',
}

function CreateTaskModal({ onClose }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectAPI.getAll({ size: 100 }),
  })
  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => userAPI.getAll({ size: 100 }),
  })

  const projects = projectsData?.data?.content || []
  const users = usersData?.data?.content || []

  const mutation = useMutation({
    mutationFn: (data) => taskAPI.create({
      ...data,
      projectId: Number(data.projectId),
      assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      toast.success('Task created!')
      onClose()
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Task</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="form-group">
            <label className="label">Task Title *</label>
            <input {...register('title')} className="input" placeholder="e.g. Implement login flow" />
            {errors.title && <span className="error-text">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none min-h-[80px]" placeholder="Task details..." />
          </div>

          <div className="form-group">
            <label className="label">Project *</label>
            <select {...register('projectId')} className="input">
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.projectId && <span className="error-text">{errors.projectId.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Status</label>
              <select {...register('status')} className="input" defaultValue="TODO">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select {...register('priority')} className="input" defaultValue="MEDIUM">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Assignee</label>
              <select {...register('assigneeId')} className="input">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input {...register('dueDate')} type="date" className="input" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Estimated Hours</label>
            <input {...register('estimatedHours')} type="number" step="0.5" min="0" className="input" placeholder="e.g. 4" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskRow({ task, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors group">
      <td className="table-cell">
        <div className="flex items-start gap-3">
          <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', PRIORITY_DOT[task.priority])} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate max-w-xs">{task.title}</p>
            {task.description && (
              <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{task.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="table-cell hidden md:table-cell">
        <Link to={`/projects/${task.projectId}`} className="text-indigo-400 hover:text-indigo-300 text-sm truncate max-w-[120px] block">
          {task.projectName}
        </Link>
      </td>
      <td className="table-cell">
        <span className={STATUS_STYLES[task.status]}>
          {task.status?.replace('_', ' ')}
        </span>
      </td>
      <td className="table-cell hidden lg:table-cell">
        <span className={PRIORITY_STYLES[task.priority]}>{task.priority}</span>
      </td>
      <td className="table-cell hidden lg:table-cell">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">
              {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
            </div>
            <span className="text-sm text-slate-300 truncate">{task.assignee.firstName}</span>
          </div>
        ) : (
          <span className="text-slate-600 text-sm">Unassigned</span>
        )}
      </td>
      <td className="table-cell hidden xl:table-cell">
        {task.dueDate ? (
          <span className={clsx('text-sm flex items-center gap-1', task.overdue ? 'text-red-400' : 'text-slate-400')}>
            <Calendar size={12} />
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </span>
        ) : <span className="text-slate-600">—</span>}
      </td>
      <td className="table-cell">
        <div className="relative">
          <button onClick={() => setMenuOpen(p => !p)} className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
              <button onClick={() => { onDelete(task.id); setMenuOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 w-full">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function TasksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [viewMine, setViewMine] = useState(false)
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const queryKey = ['tasks', page, search, statusFilter, priorityFilter, viewMine]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      if (search) return taskAPI.search(search, { page, size: 20 })
      if (viewMine) return taskAPI.getMine({ page, size: 20 })
      return taskAPI.getByProject ? taskAPI.getMine({ page, size: 20 }) : taskAPI.getMine({ page, size: 20 })
    },
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: taskAPI.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted') },
  })

  const tasks = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{data?.data?.totalElements || 0} total tasks</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search tasks..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="input w-40">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(0) }}
          className="input w-40">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => { setViewMine(p => !p); setPage(0) }}
          className={clsx(viewMine ? 'btn-primary' : 'btn-secondary', 'whitespace-nowrap')}
        >
          <User size={16} /> My Tasks
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/30 border-b border-slate-700">
              <tr>
                <th className="table-header text-left">Task</th>
                <th className="table-header text-left hidden md:table-cell">Project</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left hidden lg:table-cell">Priority</th>
                <th className="table-header text-left hidden lg:table-cell">Assignee</th>
                <th className="table-header text-left hidden xl:table-cell">Due Date</th>
                <th className="table-header w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell py-16 text-center">
                    <CheckSquare size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">No tasks found</p>
                    <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto mt-3">
                      <Plus size={16} /> Create Task
                    </button>
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <TaskRow key={task.id} task={task}
                    onDelete={id => { if (confirm('Delete this task?')) deleteMutation.mutate(id) }} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary px-3 py-1.5 text-sm">Prev</button>
          <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
