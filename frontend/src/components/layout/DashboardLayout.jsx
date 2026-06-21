import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Activity,
  Bell, User, LogOut, Menu, X, ChevronRight, Zap, Search
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api/services'
import { useQuery } from '@tanstack/react-query'
import { notificationAPI } from '../../api/services'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/activity', label: 'Activity', icon: Activity },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationAPI.getUnreadCount(),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.data || 0

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const avatarInitials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'U'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <span className="font-bold text-slate-100 text-lg leading-tight">Nexus</span>
            <p className="text-xs text-slate-500 leading-tight">Project Hub</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={clsx('sidebar-link', active && 'active')}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {active && sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-700/60 space-y-1">
        <Link to="/profile" onClick={() => setMobileOpen(false)} className="sidebar-link">
          <User size={18} className="flex-shrink-0" />
          {sidebarOpen && <span>Profile</span>}
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>

        {sidebarOpen && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-slate-700/40 rounded-lg">
            <div className="avatar w-8 h-8 bg-indigo-600 text-xs flex-shrink-0">
              {avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-slate-800 border-r border-slate-700/60 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-slate-800 border-r border-slate-700">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSidebarOpen(p => !p); setMobileOpen(p => !p) }}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Search bar */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-72">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              to="/dashboard"
              className="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="avatar w-8 h-8 bg-indigo-600 text-xs ml-1">
              {avatarInitials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
