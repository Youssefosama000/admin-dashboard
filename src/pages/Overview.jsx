import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Store, UtensilsCrossed, ChevronRight, GitPullRequestDraft, Building2, CheckCircle } from 'lucide-react'
import { listApplications, getUnreviewedMeals, getPendingBranches } from '../services/restaurants'
import './Overview.css'

function Overview() {
  const [recentApps, setRecentApps]     = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [meals, setMeals]               = useState([])
  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    Promise.allSettled([
      // recent apps list (first page, default size)
      listApplications({ page: 1, pageSize: 10 }),
      // pending count only (pageSize:1 is enough to get `total`)
      listApplications({ page: 1, pageSize: 1, status: 'Pending' }),
      // approved count only
      listApplications({ page: 1, pageSize: 1, status: 'Approved' }),
      getUnreviewedMeals(),
      getPendingBranches(),
    ]).then(([recentRes, pendingRes, approvedRes, mealsRes, branchesRes]) => {
      if (recentRes.status === 'fulfilled')   setRecentApps(recentRes.value.items ?? [])
      if (pendingRes.status === 'fulfilled')  setPendingCount(pendingRes.value.total ?? 0)
      if (approvedRes.status === 'fulfilled') setApprovedCount(approvedRes.value.total ?? 0)
      if (mealsRes.status === 'fulfilled')    setMeals(mealsRes.value)
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value)
    }).finally(() => setLoading(false))
  }, [])

  const pendingApps     = pendingCount
  const approvedApps    = approvedCount
  const pendingMeals    = meals.length
  const pendingBranches = branches.filter(b => !b.isActive).length

  const recentMeals = meals.slice(0, 5)

  return (
    <div className="overview">

      {/* stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(61,191,82,0.1)' }}>
            <GitPullRequestDraft size={20} color="#3DBF52" />
          </div>
          <span className="stat-value">{loading ? '—' : pendingApps}</span>
          <span className="stat-label">Pending Applications</span>
          <span className="stat-sub">Awaiting review</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <CheckCircle size={20} color="#3B82F6" />
          </div>
          <span className="stat-value">{loading ? '—' : approvedApps}</span>
          <span className="stat-label">Approved Restaurants</span>
          <span className="stat-sub">Live on platform</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <UtensilsCrossed size={20} color="#B45309" />
          </div>
          <span className="stat-value">{loading ? '—' : pendingMeals}</span>
          <span className="stat-label">Meals to Review</span>
          <span className="stat-sub">Pending approval</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Building2 size={20} color="#7C3AED" />
          </div>
          <span className="stat-value">{loading ? '—' : pendingBranches}</span>
          <span className="stat-label">Branches to Activate</span>
          <span className="stat-sub">Waiting for activation</span>
        </div>
      </div>

      {/* quick actions */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>Quick Actions</h2>
        <div className="action-cards">
          <Link to="/restaurants" className="action-card">
            <div className="action-card-icon action-card-icon--green">
              <Store size={20} color="#3DBF52" />
            </div>
            <div>
              <p className="action-card-title">Review Restaurant Applications</p>
              <p className="action-card-desc">{loading ? '…' : `${pendingApps} application${pendingApps !== 1 ? 's' : ''} waiting`}</p>
            </div>
            <ChevronRight size={18} color="#9A9A9A" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </Link>
          <Link to="/meals" className="action-card">
            <div className="action-card-icon action-card-icon--amber">
              <UtensilsCrossed size={20} color="#B45309" />
            </div>
            <div>
              <p className="action-card-title">Review Meal Submissions</p>
              <p className="action-card-desc">{loading ? '…' : `${pendingMeals} meal${pendingMeals !== 1 ? 's' : ''} pending`}</p>
            </div>
            <ChevronRight size={18} color="#9A9A9A" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </Link>
        </div>
      </div>

      {/* recent activity */}
      <div className="activity-grid">
        <div className="activity-section">
          <div className="section-header">
            <h2 className="section-title">Recent Applications</h2>
            <Link to="/restaurants" style={{ fontSize: '12px', color: '#3DBF52', fontWeight: 500 }}>See all</Link>
          </div>
          {loading && <p style={{ color: '#9A9A9A', fontSize: '13px', padding: '12px 0' }}>Loading…</p>}
          {!loading && recentApps.length === 0 && (
            <p style={{ color: '#9A9A9A', fontSize: '13px', padding: '12px 0' }}>No applications yet.</p>
          )}
          {recentApps.map(r => (
            <div key={r.id} className="activity-row">
              <div className="activity-icon" style={{ background: r.logoColor + '22', color: r.logoColor, fontWeight: 700, fontSize: '12px', padding: 0 }}>
                {r.logo}
              </div>
              <div className="activity-info">
                <span className="activity-name">{r.name}</span>
                <span className="activity-time">{r.submittedAt}</span>
              </div>
              <span className={`badge badge--${r.status}`}>{r.status}</span>
            </div>
          ))}
        </div>

        <div className="activity-section">
          <div className="section-header">
            <h2 className="section-title">Pending Meals</h2>
            <Link to="/meals" style={{ fontSize: '12px', color: '#3DBF52', fontWeight: 500 }}>See all</Link>
          </div>
          {loading && <p style={{ color: '#9A9A9A', fontSize: '13px', padding: '12px 0' }}>Loading…</p>}
          {!loading && recentMeals.length === 0 && (
            <p style={{ color: '#9A9A9A', fontSize: '13px', padding: '12px 0' }}>No pending meals.</p>
          )}
          {recentMeals.map(m => (
            <div key={m.id} className="activity-row">
              <div className="activity-icon" style={{ overflow: 'hidden', padding: 0 }}>
                {m.imgUrl
                  ? <img src={m.imgUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} />
                  : <UtensilsCrossed size={15} color="#9A9A9A" />
                }
              </div>
              <div className="activity-info">
                <span className="activity-name">{m.name}</span>
                <span className="activity-time">{m.restaurantName}</span>
              </div>
              <span className="badge badge--pending">pending</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Overview
