import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Store, Zap, UtensilsCrossed, LogOut } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ user, onLogout }) {
  return (
    <div className="sidebar">

      <div className="sidebar-logo">
        <img src="/greenLogo.png" alt="Slyce" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">Slyce</span>
        <span className="sidebar-badge">ADMIN</span>
      </div>

      <hr className="sidebar-hr" />

      <p className="sidebar-section-label">MAIN MENU</p>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'sidebar-item sidebar-item--active' : 'sidebar-item'}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/restaurants" className={({ isActive }) => isActive ? 'sidebar-item sidebar-item--active' : 'sidebar-item'}>
          <Store size={16} /> Restaurant Applications
        </NavLink>
        <NavLink to="/activate" className={({ isActive }) => isActive ? 'sidebar-item sidebar-item--active' : 'sidebar-item'}>
          <Zap size={16} /> Activate Restaurants
        </NavLink>
        <NavLink to="/meals" className={({ isActive }) => isActive ? 'sidebar-item sidebar-item--active' : 'sidebar-item'}>
          <UtensilsCrossed size={16} /> Meals Approval
        </NavLink>
      </nav>

      <div style={{ flex: 1 }} />
      <hr className="sidebar-hr" />

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{(user?.name ?? 'A')[0].toUpperCase()}</div>
        <div>
          <p className="sidebar-user-name">{user?.name ?? 'Admin'}</p>
          <p className="sidebar-user-email">{user?.email ?? ''}</p>
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Sign out">
          <LogOut size={15} />
        </button>
      </div>

    </div>
  )
}

export default Sidebar
