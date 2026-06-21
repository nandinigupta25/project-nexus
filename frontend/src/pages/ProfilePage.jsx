import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI, authAPI } from '../api/services'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { User, Mail, Briefcase, Phone, FileText, Lock, Loader2, Shield } from 'lucide-react'

const profileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const ROLE_LABELS = { ADMIN: 'Administrator', PROJECT_MANAGER: 'Project Manager', TEAM_MEMBER: 'Team Member' }
const ROLE_COLORS = { ADMIN: 'bg-red-500/20 text-red-400', PROJECT_MANAGER: 'bg-amber-500/20 text-amber-400', TEAM_MEMBER: 'bg-blue-500/20 text-blue-400' }

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      jobTitle: user?.jobTitle || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: userAPI.updateMe,
    onSuccess: (res) => {
      updateUser(res.data)
      toast.success('Profile updated!')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!')
      passwordForm.reset()
    },
  })

  const initials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'U'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account information and security</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.firstName} {user?.lastName}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge text-xs ${ROLE_COLORS[user?.role] || ''}`}>
                <Shield size={10} className="mr-1" />
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
              {user?.jobTitle && (
                <span className="text-xs text-slate-500">{user.jobTitle}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-200 mb-5 flex items-center gap-2">
          <User size={18} className="text-indigo-400" /> Personal Information
        </h2>
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">First Name</label>
              <input {...profileForm.register('firstName')} className="input" />
              {profileForm.formState.errors.firstName && (
                <span className="error-text">{profileForm.formState.errors.firstName.message}</span>
              )}
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input {...profileForm.register('lastName')} className="input" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={user?.email} disabled className="input pl-9 opacity-60 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
          </div>

          <div className="form-group">
            <label className="label">Job Title</label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input {...profileForm.register('jobTitle')} className="input pl-9" placeholder="e.g. Senior Developer" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input {...profileForm.register('phone')} className="input pl-9" placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Bio</label>
            <textarea {...profileForm.register('bio')} className="input resize-none min-h-[80px]"
              placeholder="Tell your team a bit about yourself..." />
          </div>

          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-200 mb-5 flex items-center gap-2">
          <Lock size={18} className="text-indigo-400" /> Change Password
        </h2>
        <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
          <div className="form-group">
            <label className="label">Current Password</label>
            <input {...passwordForm.register('currentPassword')} type="password" className="input" placeholder="••••••••" />
            {passwordForm.formState.errors.currentPassword && (
              <span className="error-text">{passwordForm.formState.errors.currentPassword.message}</span>
            )}
          </div>
          <div className="form-group">
            <label className="label">New Password</label>
            <input {...passwordForm.register('newPassword')} type="password" className="input" placeholder="Min 8 characters" />
            {passwordForm.formState.errors.newPassword && (
              <span className="error-text">{passwordForm.formState.errors.newPassword.message}</span>
            )}
          </div>
          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <input {...passwordForm.register('confirmPassword')} type="password" className="input" placeholder="Repeat new password" />
            {passwordForm.formState.errors.confirmPassword && (
              <span className="error-text">{passwordForm.formState.errors.confirmPassword.message}</span>
            )}
          </div>

          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
