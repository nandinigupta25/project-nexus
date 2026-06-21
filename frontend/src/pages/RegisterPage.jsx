import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../api/services'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, User, Briefcase, Loader2 } from 'lucide-react'

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'At least 8 characters'),
  jobTitle: z.string().optional(),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (res) => {
      login(res.data)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-purple-900/20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Create account</h1>
          <p className="text-slate-400 mt-2">Join Project Nexus today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">First name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input {...register('firstName')} placeholder="John" className="input pl-9" />
                </div>
                {errors.firstName && <span className="error-text">{errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Last name</label>
                <input {...register('lastName')} placeholder="Doe" className="input" />
                {errors.lastName && <span className="error-text">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input {...register('email')} type="email" placeholder="you@example.com" className="input pl-9" />
              </div>
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="label">Job title <span className="text-slate-600">(optional)</span></label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input {...register('jobTitle')} placeholder="e.g. Senior Developer" className="input pl-9" />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input {...register('password')} type="password" placeholder="Min 8 characters" className="input pl-9" />
              </div>
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full justify-center py-2.5 mt-2">
              {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
