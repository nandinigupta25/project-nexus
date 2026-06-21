import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectAPI } from '../api/services'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Plus, Search, FolderKanban, Calendar, Users, MoreVertical,
  Archive, Trash2, Edit, Loader2, X, Filter
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const schema = z.object({
  name: z.string().min(3, 'At least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

function ProjectCard({ project, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="card p-5 hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <FolderKanban size={18} className="text-indigo-400" />
          </div>
          <div>
            <Link to={`/projects/${project.id}`} className="font-semibold text-slate-200 hover:text-indigo-400 transition-colors line-clamp-1">
              {project.name}
            </Link>
            <p className="text-xs text-slate-500">{project.owner?.firstName} {project.owner?.lastName}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(p => !p)} className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
              <Link to={`/projects/${project.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700" onClick={() => setMenuOpen(false)}>
                <Edit size={14} /> Edit Project
              </Link>
              <button onClick={() => { onArchive(project.id); setMenuOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-slate-700 w-full">
                <Archive size={14} /> Archive
              </button>
              <button onClick={() => { onDelete(project.id); setMenuOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 w-full">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs text-slate-400">{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FolderKanban size={12} /> {project.totalTasks} tasks
          </span>
          {project.endDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {format(new Date(project.endDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'badge text-xs',
            project.priority === 'CRITICAL' ? 'badge-critical' :
            project.priority === 'HIGH' ? 'badge-high' :
            project.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
          )}>{project.priority}</span>
          <span className={clsx(
            'badge text-xs',
            project.status === 'ACTIVE' ? 'badge-active' :
            project.status === 'COMPLETED' ? 'badge-completed' :
            project.status === 'ON_HOLD' ? 'badge-on-hold' :
            project.status === 'PLANNING' ? 'badge-planning' : 'badge-archived'
          )}>{project.status?.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  )
}

function CreateProjectModal({ onClose }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: projectAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created!')
      onClose()
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Project</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Website Redesign" />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input min-h-[80px] resize-none" placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.slice(0, 4).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Start Date</label>
              <input {...register('startDate')} type="date" className="input" />
            </div>
            <div className="form-group">
              <label className="label">End Date</label>
              <input {...register('endDate')} type="date" className="input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, statusFilter],
    queryFn: () => search
      ? projectAPI.search(search, { page, size: 12 })
      : statusFilter
      ? projectAPI.getByStatus(statusFilter, { page, size: 12 })
      : projectAPI.getAll({ page, size: 12, sortBy: 'createdAt', sortDir: 'desc' }),
    keepPreviousData: true,
  })

  const archiveMutation = useMutation({
    mutationFn: projectAPI.archive,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project archived') },
  })

  const deleteMutation = useMutation({
    mutationFn: projectAPI.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted') },
  })

  const projects = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{data?.data?.totalElements || 0} total projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search projects..." className="input pl-9" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            className="input pl-9 pr-8 w-44">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No projects found</p>
          <p className="text-sm text-slate-600 mt-1">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto mt-4">
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p}
              onArchive={id => archiveMutation.mutate(id)}
              onDelete={id => { if (confirm('Delete this project?')) deleteMutation.mutate(id) }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary px-3 py-1.5 text-sm">Prev</button>
          <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
