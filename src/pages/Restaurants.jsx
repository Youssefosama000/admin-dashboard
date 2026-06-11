import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Zap, ChevronDown, ChevronUp, Check, RefreshCw, Store, Building2 } from 'lucide-react'
import {
  listApplications,
  activateRestaurant,
  activateBranch,
  getPendingBranches,
  getBranchDetails,
} from '../services/restaurants'
import './Restaurants.css'

function Restaurants() {
  // ── approved restaurants (informational) ─────────────────
  const [apps, setApps] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)

  // ── branches ─────────────────────────────────────────────
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [branchesError, setBranchesError] = useState(null)

  // ── per-branch state ──────────────────────────────────────
  const [expanded, setExpanded] = useState({})      // { [branchId]: bool }
  const [details, setDetails] = useState({})         // { [branchId]: detailObj | null }
  const [detailLoading, setDetailLoading] = useState({})

  // ── activated tracking ────────────────────────────────────
  const [activatedBranches, setActivatedBranches] = useState({})
  const [activatedRestaurants, setActivatedRestaurants] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  // ── toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ── load approved apps ────────────────────────────────────
  useEffect(() => {
    listApplications({ status: 'Approved', pageSize: 10 })
      .then(r => setApps(r.items))
      .catch(() => {})
      .finally(() => setAppsLoading(false))
  }, [])

  // ── load pending branches ─────────────────────────────────
  const loadBranches = useCallback(async () => {
    setBranchesLoading(true)
    setBranchesError(null)
    try {
      const items = await getPendingBranches()
      setBranches(items)
    } catch (err) {
      setBranchesError(err.message ?? 'Failed to load branches')
    } finally {
      setBranchesLoading(false)
    }
  }, [])

  useEffect(() => { loadBranches() }, [loadBranches])

  // ── expand branch → load detail ───────────────────────────
  async function toggleExpand(branchId) {
    const next = !expanded[branchId]
    setExpanded(prev => ({ ...prev, [branchId]: next }))

    if (!next || details[branchId] !== undefined) return  // collapse or already loaded

    setDetailLoading(prev => ({ ...prev, [branchId]: true }))
    try {
      const d = await getBranchDetails(branchId)
      setDetails(prev => ({ ...prev, [branchId]: d }))
      // pre-fill active states from detail
      if (d.isActive) setActivatedBranches(prev => ({ ...prev, [branchId]: true }))
    } catch {
      setDetails(prev => ({ ...prev, [branchId]: null }))
    } finally {
      setDetailLoading(prev => ({ ...prev, [branchId]: false }))
    }
  }

  // ── activate branch ───────────────────────────────────────
  async function handleActivateBranch(e, branchId, branchName) {
    e.stopPropagation()
    setActionLoading(prev => ({ ...prev, [`b-${branchId}`]: true }))
    try {
      await activateBranch(branchId)
      setActivatedBranches(prev => ({ ...prev, [branchId]: true }))
      setDetails(prev => prev[branchId]
        ? { ...prev, [branchId]: { ...prev[branchId], isActive: true } }
        : prev)
      showToast(`"${branchName}" is now active!`)
    } catch (err) {
      showToast(err.message ?? 'Branch activation failed', 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [`b-${branchId}`]: false }))
    }
  }

  // ── activate restaurant (using restaurantId from branch detail) ──
  async function handleActivateRestaurant(e, restaurantId, branchName) {
    e.stopPropagation()
    setActionLoading(prev => ({ ...prev, [`r-${restaurantId}`]: true }))
    try {
      await activateRestaurant(restaurantId)
      setActivatedRestaurants(prev => ({ ...prev, [restaurantId]: true }))
      showToast(`Restaurant for "${branchName}" is now live on the app!`)
    } catch (err) {
      showToast(err.message ?? 'Restaurant activation failed', 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [`r-${restaurantId}`]: false }))
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="rest-page">
      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>,
        document.body
      )}

      <div className="flow-banner">
        <span className="flow-step flow-step--done">① Application Approved</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step flow-step--done">② Manager Sets Up</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step flow-step--active">③ Admin Activates</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step">④ Live on App</span>
      </div>

      {/* ── APPROVED RESTAURANTS (informational) ── */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Approved Restaurants</h2>
          <p className="section-sub">Restaurants that passed review. Activate their branches below.</p>
        </div>
      </div>

      {appsLoading && <div className="center-msg">Loading…</div>}
      {!appsLoading && apps.length === 0 && (
        <div className="empty-state"><Store size={28} color="#DDD6CC" /><p>No approved restaurants yet.</p></div>
      )}
      {!appsLoading && apps.length > 0 && (
        <div className="rest-list">
          {apps.map(r => (
            <div key={r.id} className="rest-card">
              <div className="rest-row" style={{ cursor: 'default' }}>
                <div className="rest-avatar" style={{ background: r.logoColor + '22', color: r.logoColor }}>{r.logo}</div>
                <div className="rest-info">
                  <span className="rest-name">{r.name}</span>
                  <span className="rest-meta">{r.cuisine || 'Restaurant'}</span>
                </div>
                <span className="badge badge--approved">Approved</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BRANCHES ── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Branches</h2>
            <p className="section-sub">Click a branch to load details and activate the restaurant or branch.</p>
          </div>
          <button onClick={loadBranches} className="refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><RefreshCw size={13} /> Refresh</button>
        </div>

        {branchesLoading && <div className="center-msg">Loading branches…</div>}
        {branchesError && !branchesLoading && (
          <div className="center-msg" style={{ color: '#E74C3C' }}>
            {branchesError}
            <button onClick={loadBranches} className="retry-btn">Retry</button>
          </div>
        )}
        {!branchesLoading && !branchesError && branches.length === 0 && (
          <div className="empty-state">
            <Building2 size={28} color="#DDD6CC" />
            <p>No pending branches. All branches are active or none have been added yet.</p>
          </div>
        )}

        {!branchesLoading && !branchesError && branches.length > 0 && (
          <div className="rest-list">
            {branches.map(branch => {
              const isExpanded = !!expanded[branch.id]
              // pending endpoint may return full data; fall back to lazy-loaded detail
              const detail = (branch.streetName || branch.contactNumber || branch.city)
                ? branch
                : details[branch.id]
              const isBranchActive = activatedBranches[branch.id] || branch.isActive || detail?.isActive || false
              const restaurantId = branch.restaurantId ?? detail?.restaurantId
              const isRestActive = restaurantId ? (activatedRestaurants[restaurantId] || false) : null

              return (
                <div key={branch.id} className="rest-card">
                  {/* row */}
                  <div className="rest-row" onClick={() => toggleExpand(branch.id)} style={{ cursor: 'pointer' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: isBranchActive ? '#3DBF52' : '#DDD6CC',
                    }} />

                    <div className="rest-info">
                      <span className="rest-name">{branch.name}</span>
                      {detail && (
                        <span className="rest-meta">
                          {[detail.streetName, detail.streetNumber, detail.area, detail.city].filter(Boolean).join(', ') || 'No address on file'}
                        </span>
                      )}
                    </div>

                    {detailLoading[branch.id] && (
                      <span style={{ fontSize: '12px', color: '#9A9A9A' }}>Loading…</span>
                    )}

                    {!detail && !detailLoading[branch.id] && (
                      <span style={{ fontSize: '11px', color: '#9A9A9A' }}>Click for details</span>
                    )}

                    <span className={`badge ${isBranchActive ? 'badge--approved' : 'badge--pending'}`}>
                      {isBranchActive ? 'Active' : 'Inactive'}
                    </span>

                    {/* activate branch — stops propagation so row expand doesn't also fire */}
                    {!isBranchActive && (
                      <button
                        className="activate-btn"
                        disabled={actionLoading[`b-${branch.id}`]}
                        onClick={e => handleActivateBranch(e, branch.id, branch.name)}
                      >
                        {actionLoading[`b-${branch.id}`] ? 'Wait…' : <><Zap size={13} style={{ marginRight: 4 }} />Activate Branch</>}
                      </button>
                    )}

                    {isBranchActive && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3DBF52', fontWeight: 600, flexShrink: 0 }}>
                        <Check size={13} /> Branch Live
                      </span>
                    )}

                    <span style={{ color: '#9A9A9A', marginLeft: '4px', flexShrink: 0, display: 'flex' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>

                  {/* expanded detail */}
                  {isExpanded && (
                    <div className="branches-section">
                      {detail === null && (
                        <p style={{ padding: '12px 20px', color: '#E74C3C', fontSize: '13px' }}>
                          Could not load details.
                        </p>
                      )}

                      {detail && (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* info row */}
                          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            {detail.contactNumber && (
                              <div>
                                <p style={{ fontSize: '11px', color: '#9A9A9A', fontWeight: 600, marginBottom: '3px' }}>CONTACT</p>
                                <p style={{ fontSize: '13px', color: '#1C1C1E' }}>{detail.contactNumber}</p>
                              </div>
                            )}
                            {(detail.streetName || detail.area || detail.city) && (
                              <div>
                                <p style={{ fontSize: '11px', color: '#9A9A9A', fontWeight: 600, marginBottom: '3px' }}>ADDRESS</p>
                                <p style={{ fontSize: '13px', color: '#1C1C1E' }}>
                                  {[detail.streetName, detail.streetNumber, detail.area, detail.city].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* restaurant activation — only shown when restaurantId is known */}
                          {restaurantId && !isRestActive && (
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.06)',
                              border: '1px solid rgba(245, 158, 11, 0.2)',
                              borderRadius: '10px',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', marginBottom: '2px' }}>Restaurant not yet active</p>
                                <p style={{ fontSize: '12px', color: '#B45309' }}>Activate the restaurant to make it visible on the app.</p>
                              </div>
                              <button
                                className="activate-btn"
                                disabled={actionLoading[`r-${restaurantId}`]}
                                onClick={e => handleActivateRestaurant(e, restaurantId, branch.name)}
                              >
                                {actionLoading[`r-${restaurantId}`] ? 'Activating…' : <><Zap size={13} style={{ marginRight: 4 }} />Activate Restaurant</>}
                              </button>
                            </div>
                          )}

                          {restaurantId && isRestActive && (
                            <p style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#3DBF52', fontWeight: 600 }}>
                              <Check size={14} /> Restaurant is live on the app
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Restaurants
