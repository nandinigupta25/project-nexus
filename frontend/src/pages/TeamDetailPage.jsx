import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamAPI, userAPI } from '../api/services'
import toast from 'react-hot-toast'
import { ArrowLeft, UserPlus, UserMinus, Crown, Users, Briefcase } from 'lucide-react'

export default function TeamDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [addMemberId, setAddMemberId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamAPI.getById(id),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => userAPI.getAll({ size: 100 }),
  })

  const addMutation = useMutation({
    mutationFn: (userId) => teamAPI.addMember(id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team', id] }); toast.success('Member added') },
  })

  const removeMutation = useMutation({
    mutationFn: (userId) => teamAPI.removeMember(id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team', id] }); toast.success('Member removed') },
  })

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-40 rounded-xl" />
    </div>
  )

  const team = data?.data
  const users = usersData?.data?.content || []
  const memberIds = new Set(team?.members?.map(m => m.id))
  const nonMembers = users.filter(u => !memberIds.has(u.id))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/teams" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: team?.avatarColor || '#6366f1' }}>
            {team?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{team?.name}</h1>
            {team?.description && <p className="text-sm text-slate-500 mt-0.5">{team.description}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Users size={24} className="mx-auto text-indigo-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{team?.memberCount || 0}</p>
          <p className="text-xs text-slate-500">Members</p>
        </div>
        <div className="card p-4 text-center">
          <Briefcase size={24} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{team?.projectCount || 0}</p>
          <p className="text-xs text-slate-500">Projects</p>
        </div>
        <div className="card p-4 text-center">
          <Crown size={24} className="mx-auto text-amber-400 mb-2" />
          <p className="text-sm font-semibold text-slate-100">{team?.manager ? `${team.manager.firstName} ${team.manager.lastName}` : '—'}</p>
          <p className="text-xs text-slate-500">Manager</p>
        </div>
      </div>

      {/* Add member */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-200 mb-4">Add Member</h2>
        <div className="flex gap-3">
          <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} className="input flex-1">
            <option value="">Select user to add...</option>
            {nonMembers.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.jobTitle || u.role}</option>
            ))}
          </select>
          <button onClick={() => { if (addMemberId) { addMutation.mutate(addMemberId); setAddMemberId('') } }}
            disabled={!addMemberId || addMutation.isPending} className="btn-primary whitespace-nowrap">
            <UserPlus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-200 mb-4">Members ({team?.memberCount || 0})</h2>
        <div className="space-y-2">
          {(team?.members || []).map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
                  {member.firstName?.[0]}{member.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {member.firstName} {member.lastName}
                    {team.manager?.id === member.id && (
                      <Crown size={12} className="inline ml-1.5 text-amber-400" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{member.jobTitle || member.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{member.email}</span>
                {team.manager?.id !== member.id && (
                  <button onClick={() => removeMutation.mutate(member.id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!team?.members || team.members.length === 0) && (
            <p className="text-center text-slate-500 py-8">No members yet. Add someone above.</p>
          )}
        </div>
      </div>
    </div>
  )
}
