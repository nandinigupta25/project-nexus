import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamAPI, userAPI } from '../api/services'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Search, Users, Briefcase, X, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  description: z.string().optional(),
  managerId: z.string().optional(),
  avatarColor: z.string().optional(),
})

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

function CreateTeamModal({ onClose }) {
  const queryClient = useQueryClient()
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => userAPI.getAll({ size: 100 }),
  })
  const users = usersData?.data?.content || []

  const mutation = useMutation({
    mutationFn: (data) => teamAPI.create({
      ...data,
      managerId: data.managerId ? Number(data.managerId) : undefined,
      avatarColor: selectedColor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team created!')
      onClose()
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Team</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="form-group">
            <label className="label">Team Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Frontend Squad" />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none min-h-[70px]" placeholder="Team focus and goals..." />
          </div>
          <div className="form-group">
            <label className="label">Manager</label>
            <select {...register('managerId')} className="input">
              <option value="">Select manager...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Team Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                  style={{ background: color }}
                  className={`w-8 h-8 rounded-lg transition-all ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeamCard({ team }) {
  return (
    <Link to={`/teams/${team.id}`} className="card p-5 hover:border-slate-600 transition-all block group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: team.avatarColor || '#6366f1' }}>
          {team.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{team.name}</h3>
          {team.manager && (
            <p className="text-xs text-slate-500 mt-0.5">
              Manager: {team.manager.firstName} {team.manager.lastName}
            </p>
          )}
        </div>
      </div>

      {team.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{team.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users size={12} /> {team.memberCount} members</span>
          <span className="flex items-center gap-1"><Briefcase size={12} /> {team.projectCount} projects</span>
        </div>
        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {(team.members || []).slice(0, 4).map(m => (
            <div key={m.id} title={`${m.firstName} ${m.lastName}`}
              className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-slate-800 flex items-center justify-center text-[9px] text-white">
              {m.firstName?.[0]}{m.lastName?.[0]}
            </div>
          ))}
          {team.memberCount > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-[9px] text-slate-300">
              +{team.memberCount - 4}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function TeamsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, search],
    queryFn: () => search
      ? teamAPI.search(search, { page, size: 12 })
      : teamAPI.getAll({ page, size: 12 }),
    keepPreviousData: true,
  })

  const teams = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">{data?.data?.totalElements || 0} teams</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> New Team
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search teams..." className="input pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No teams found</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto mt-4">
            <Plus size={16} /> Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map(t => <TeamCard key={t.id} team={t} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary px-3 py-1.5 text-sm">Prev</button>
          <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
        </div>
      )}

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
