import { useQuery } from '@tanstack/react-query'
import { dashboardAPI, taskAPI, projectAPI } from '../api/services'
import { useAuthStore } from '../store/authStore'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { FolderKanban, CheckSquare, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const PRIORITY_COLORS = { LOW: '#94a3b8', MEDIUM: '#60a5fa', HIGH: '#f59e0b', CRITICAL: '#ef4444' }
const STATUS_COLORS = { PLANNING: '#6366f1', ACTIVE: '#10b981', ON_HOLD: '#f59e0b', COMPLETED: '#8b5cf6', ARCHIVED: '#475569' }

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  }
  return (
    <div className="stat-card hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold text-slate-100">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
  })

  const { data: myTasksData } = useQuery({
    queryKey: ['my-tasks-dashboard'],
    queryFn: () => taskAPI.getMine({ size: 5, page: 0 }),
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => projectAPI.getAll({ size: 5, page: 0 }),
  })

  const stats = statsData?.data
  const myTasks = myTasksData?.data?.content || []
  const projects = projectsData?.data?.content || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          {greeting}, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Here's what's happening with your projects today — {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats?.totalProjects ?? 0}
          sub={`${stats?.activeProjects ?? 0} active`} color="indigo" />
        <StatCard icon={CheckSquare} label="Completed Tasks" value={stats?.completedTasks ?? 0}
          sub="All time" color="emerald" />
        <StatCard icon={Clock} label="Pending Tasks" value={stats?.pendingTasks ?? 0}
          sub="Needs attention" color="amber" />
        <StatCard icon={Users} label="Team Members" value={stats?.totalMembers ?? 0}
          sub={`${stats?.totalTeams ?? 0} teams`} color="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-200">Task Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
            </div>
            <TrendingUp size={18} className="text-indigo-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.monthlyActivity || []}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tasksCreated" name="Created" stroke="#6366f1" fill="url(#colorCreated)" strokeWidth={2} />
              <Area type="monotone" dataKey="tasksCompleted" name="Completed" stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-200">Projects by Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Current distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={(stats?.projectsByStatus || []).filter(s => s.count > 0)}
                cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="count" nameKey="status" paddingAngle={3}
              >
                {(stats?.projectsByStatus || []).map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {status.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">My Tasks</h2>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <CheckSquare size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'CRITICAL' ? 'bg-red-400' :
                    task.priority === 'HIGH' ? 'bg-amber-400' :
                    task.priority === 'MEDIUM' ? 'bg-blue-400' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.projectName}</p>
                  </div>
                  <span className={`badge-${task.status?.toLowerCase().replace('_', '-')}`}>
                    {task.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Recent Projects</h2>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <FolderKanban size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(project => (
                <Link key={project.id} to={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="progress-bar flex-1">
                        <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{project.progress}%</span>
                    </div>
                  </div>
                  <span className={`badge-${project.status?.toLowerCase().replace('_', '-')}`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority breakdown bar chart */}
      <div className="card p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-200">Tasks by Priority</h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribution across all projects</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats?.tasksByPriority || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="priority" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
              {(stats?.tasksByPriority || []).map((entry, index) => (
                <Cell key={index} fill={PRIORITY_COLORS[entry.priority] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
