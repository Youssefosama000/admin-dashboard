import { useLocation } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import './TopBar.css'

function TopBar() {
  const location = useLocation()

  let title = 'Dashboard'
  if (location.pathname === '/restaurants') title = 'Restaurant Applications'
  if (location.pathname === '/activate')    title = 'Activate Restaurants'
  if (location.pathname === '/meals')       title = 'Meals Approval'

  return (
    <div className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="topbar-search">
          <Search size={14} color="#9A9A9A" />
          <span style={{ color: '#9A9A9A', fontSize: '13px' }}>Search…</span>
        </div>
        <div className="topbar-notif">
          <Bell size={17} color="#1C1C1E" />
          <span className="notif-dot" />
        </div>
        <div className="topbar-avatar">P</div>
      </div>
    </div>
  )
}

export default TopBar
