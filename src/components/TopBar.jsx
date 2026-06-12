import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, Store, UtensilsCrossed } from 'lucide-react'
import { listApplications, getUnreviewedMeals } from '../services/restaurants'
import './TopBar.css'

function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const navigate  = useNavigate()

  const [open, setOpen]       = useState(false)
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const dropdownRef           = useRef(null)

  let title = 'Dashboard'
  if (location.pathname === '/restaurants') title = 'Restaurant Applications'
  if (location.pathname === '/activate')    title = 'Activate Restaurants'
  if (location.pathname === '/meals')       title = 'Meals Approval'

  // fetch pending items on mount
  useEffect(() => {
    Promise.allSettled([
      listApplications({ page: 1, pageSize: 10, status: 'Pending' }),
      getUnreviewedMeals(),
    ]).then(([appsRes, mealsRes]) => {
      const items = []
      if (appsRes.status === 'fulfilled') {
        appsRes.value.items.forEach(r => items.push({
          id:       r.id,
          type:     'restaurant',
          title:    r.name,
          subtitle: `Application submitted ${r.submittedAt}`,
          href:     '/restaurants',
        }))
      }
      if (mealsRes.status === 'fulfilled') {
        mealsRes.value.forEach(m => items.push({
          id:       m.id,
          type:     'meal',
          title:    m.name,
          subtitle: m.restaurantName ? `From ${m.restaurantName}` : 'Pending review',
          href:     '/meals',
        }))
      }
      setNotifs(items)
    }).finally(() => setLoading(false))
  }, [])

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function goTo(href) {
    navigate(href)
    setOpen(false)
  }

  return (
    <div className="topbar">
      <button className="topbar-hamburger" onClick={onMenuToggle}>
        <Menu size={20} color="#1C1C1E" />
      </button>
      <h1 className="topbar-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="topbar-search">
          <Search size={14} color="#9A9A9A" />
          <span style={{ color: '#9A9A9A', fontSize: '13px' }}>Search…</span>
        </div>

        {/* Bell with dropdown */}
        <div className="notif-wrap" ref={dropdownRef}>
          <button className="topbar-notif" onClick={() => setOpen(o => !o)}>
            <Bell size={17} color="#1C1C1E" />
            {notifs.length > 0 && (
              <span className="notif-badge">{notifs.length > 9 ? '9+' : notifs.length}</span>
            )}
          </button>

          {open && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-header-title">Notifications</span>
                {notifs.length > 0 && (
                  <span className="notif-header-count">{notifs.length} pending</span>
                )}
              </div>

              {loading && (
                <p className="notif-empty">Loading…</p>
              )}

              {!loading && notifs.length === 0 && (
                <p className="notif-empty">All caught up! Nothing pending.</p>
              )}

              {notifs.map(n => (
                <button key={`${n.type}-${n.id}`} className="notif-item" onClick={() => goTo(n.href)}>
                  <div className={`notif-item-icon notif-item-icon--${n.type}`}>
                    {n.type === 'restaurant'
                      ? <Store size={14} />
                      : <UtensilsCrossed size={14} />
                    }
                  </div>
                  <div className="notif-item-text">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-sub">{n.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-avatar">P</div>
      </div>
    </div>
  )
}

export default TopBar
