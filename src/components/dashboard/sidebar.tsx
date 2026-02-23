'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Panou principal', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacienți', icon: Users },
  { href: '/upload', label: 'Analiză nouă', icon: Upload },
  { href: '/analize', label: 'Analize AI', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shrink-0">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-base font-bold text-gray-900 block truncate">
            Optim Dental AI
          </span>
          <span className="text-xs text-gray-500">Cabinet dentar</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full mt-auto"
      >
        <LogOut className="h-5 w-5 text-gray-400" />
        Deconectare
      </button>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col p-4 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 lg:hidden">
          <X className="h-5 w-5 text-gray-500" />
        </button>
        {navContent}
      </aside>
    </>
  )
}
