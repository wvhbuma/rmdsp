import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-rm-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
