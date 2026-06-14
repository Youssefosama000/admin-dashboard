import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Zap, ChevronDown, ChevronUp, Check, RefreshCw, Store, Building2 } from 'lucide-react'
import {
  listRestaurants,
  activateRestaurant,
  activateBranch,
  getPendingBranches,
  getBranchDetails,
} from '../services/restaurants'
import './Restaurants.css'

function Restaurants() {
  // ── under-review restaurants ───────────────────────────────
  const [restaurants, setRestaurants] = useState([])
  const [restsLoading, setRestsLoading] = useState(true)
  const [restsError, setRestsError] = useState(null)

  // ── branches ──────────────────────────────────────────────
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [branchesError, setBranchesError] = useState(null)

  // ── per-branch expand / detail ────────────────────────────
  const [expanded, setExpanded] = useState({})
  const [details, setDetails] = useState({})
  const [detailLoading, setDetailLoading] = useState({})
  const [branchErrors, setBranchErrors] = useState({}) // { [branchId]: errorMsg }

  // ── action loading ────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState({})

  // ── toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ── load under-review restaurants ─────────────────────────
  const loadRestaurants = useCallback(async () => {
    setRestsLoading(true)
    setRestsError(null)
    try {
      const r = await listRestaurants({ status: 'UnderReview' })
      setRestaurants(r.items)
    } catch (err) {
      setRestsError(err.message ?? 'Failed to load restaurants')
    } finally {
      setRestsLoading(false)
    }
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

  useEffect(() => { loadRestaurants(); loadBranches() }, [loadRestaurants, loadBranches])

  // ── activate restaurant ───────────────────────────────────
  async function handleActivateRestaurant(e, id, name) {
    e.stopPropagation()
    setActionLoading(prev => ({ ...prev, [`r-${id}`]: true }))
    try {
      await activateRestaurant(id)
      setRestaurants(prev => prev.filter(r => r.id !== id))
      showToast(`"${name}" is now live on the app!`)
    } catch (err) {
      showToast(err.message ?? 'Activation failed', 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [`r-${id}`]: false }))
    }
  }

  // ── expand branch → load detail ───────────────────────────
  async function toggleExpand(branchId) {
    const next = !expanded[branchId]
    setExpanded(prev => ({ ...prev, [branchId]: next }))
    if (!next || details[branchId] !== undefined) return

    setDetailLoading(prev => ({ ...prev, [branchId]: true }))
    try {
      const d = await getBranchDetails(branchId)
      setDetails(prev => ({ ...prev, [branchId]: d }))
      if (d.isActive) {
        setBranches(prev => prev.map(b => b.id === branchId ? { ...b, isActive: true } : b))
      }
    } catch {
      setDetails(prev => ({ ...prev, [branchId]: null }))
    } finally {
      setDetailLoading(prev => ({ ...prev, [branchId]: false }))
    }
  }

  // ── activate branch ───────────────────────────────────────
  async function handleActivateBranch(e, branchId, branchName) {
    e.stopPropagation()
    setBranchErrors(prev => ({ ...prev, [branchId]: null }))
    setActionLoading(prev => ({ ...prev, [`b-${branchId}`]: true }))
    try {
      await activateBranch(branchId)
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, isActive: true } : b))
      setDetails(prev => prev[branchId]
        ? { ...prev, [branchId]: { ...prev[branchId], isActive: true } }
        : prev)
      setBranchErrors(prev => ({ ...prev, [branchId]: null }))
      showToast(`"${branchName}" branch is now active!`)
    } catch (err) {
      const msg = err.message ?? 'Branch activation failed'
      setBranchErrors(prev => ({ ...prev, [branchId]: msg }))
      setExpanded(prev => ({ ...prev, [branchId]: true }))
    } finally {
      setActionLoading(prev => ({ ...prev, [`b-${branchId}`]: false }))
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

      {/* ── RESTAURANTS UNDER REVIEW ── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Restaurants Under Review</h2>
            <p className="section-sub">Approved applications waiting for activation. Activate to make them visible to customers.</p>
          </div>
          <button onClick={loadRestaurants} className="refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {restsLoading && <div className="center-msg">Loading restaurants…</div>}
        {restsError && !restsLoading && (
          <div className="center-msg" style={{ color: '#E74C3C' }}>
            {restsError}
            <button onClick={loadRestaurants} className="retry-btn">Retry</button>
          </div>
        )}
        {!restsLoading && !restsError && restaurants.length === 0 && (
          <div className="empty-state">
            <Store size={28} color="#DDD6CC" />
            <p>No restaurants pending activation.</p>
          </div>
        )}
        {!restsLoading && !restsError && restaurants.length > 0 && (
          <div className="rest-list">
            {restaurants.map(r => (
              <div key={r.id} className="rest-card">
                <div className="rest-row" style={{ cursor: 'default' }}>
                  <div className="rest-avatar" style={{ background: r.logoColor + '22', color: r.logoColor }}>
                    {r.logo}
                  </div>
                  <div className="rest-info">
                    <span className="rest-name">{r.name}</span>
                    <span className="rest-meta">{r.city || 'Restaurant'} · Since {r.createdAt || '—'}</span>
                  </div>
                  <span className="badge badge--pending" style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309', border: '1px solid rgba(245,158,11,0.3)' }}>
                    Under Review
                  </span>
                  <button
                    className="activate-btn"
                    disabled={!!actionLoading[`r-${r.id}`]}
                    onClick={e => handleActivateRestaurant(e, r.id, r.name)}
                  >
                    {actionLoading[`r-${r.id}`]
                      ? 'Activating…'
                      : <><Zap size={13} style={{ marginRight: 4 }} />Activate Restaurant</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BRANCHES ── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Branches</h2>
            <p className="section-sub">Click a branch to load details and activate it.</p>
          </div>
          <button onClick={loadBranches} className="refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
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
            <p>No pending branches.</p>
          </div>
        )}

        {!branchesLoading && !branchesError && branches.length > 0 && (
          <div className="rest-list">
            {branches.map(branch => {
              const isExpanded = !!expanded[branch.id]
              const detail = (branch.streetName || branch.contactNumber || branch.city)
                ? branch
                : details[branch.id]
              const isBranchActive = branch.isActive || detail?.isActive || false

              return (
                <div key={branch.id} className="rest-card">
                  <div className="rest-row" onClick={() => toggleExpand(branch.id)} style={{ cursor: 'pointer' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: isBranchActive ? '#3DBF52' : '#DDD6CC',
                    }} />

                    <div className="rest-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="rest-name">{branch.name}</span>
                        {branch.restaurantName && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9A9A', background: '#EDE5D5', borderRadius: '6px', padding: '2px 7px', flexShrink: 0 }}>
                            {branch.restaurantName}
                          </span>
                        )}
                      </div>
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

                    {!isBranchActive && (
                      <button
                        className="activate-btn"
                        disabled={actionLoading[`b-${branch.id}`]}
                        onClick={e => handleActivateBranch(e, branch.id, branch.name)}
                      >
                        {actionLoading[`b-${branch.id}`]
                          ? 'Wait…'
                          : <><Zap size={13} style={{ marginRight: 4 }} />Activate Branch</>
                        }
                      </button>
                    )}

                    {isBranchActive && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3DBF52', fontWeight: 600, flexShrink: 0 }}>
                        <Check size={13} /> Active
                      </span>
                    )}

                    <span style={{ color: '#9A9A9A', marginLeft: '4px', flexShrink: 0, display: 'flex' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="branches-section">
                      {detail === null && (
                        <p style={{ padding: '12px 20px', color: '#E74C3C', fontSize: '13px' }}>Could not load details.</p>
                      )}
                      {branchErrors[branch.id] && (
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ background: 'rgba(231,76,60,0.07)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                            <p style={{ fontSize: '13px', color: '#E74C3C', fontWeight: 600, marginBottom: '2px' }}>Cannot activate branch</p>
                            <p style={{ fontSize: '12px', color: '#E74C3C' }}>{branchErrors[branch.id]}</p>
                          </div>
                        </div>
                      )}
                      {detail && (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
