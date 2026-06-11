import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, Check, X, Eye } from 'lucide-react'
import {
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
} from '../services/restaurants'
import './RestaurantApplications.css'

const PAGE_SIZE = 10

function RestaurantApplications() {
  const [allApps,         setAllApps]         = useState([])
  const [filter,          setFilter]          = useState('all')
  const [page,            setPage]            = useState(1)
  const [selected,        setSelected]        = useState(null)
  const [detailLoading,   setDetailLoading]   = useState(false)
  const [toast,           setToast]           = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [rejectReason,    setRejectReason]    = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actionLoading,   setActionLoading]   = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const first = await listApplications({ page: 1, pageSize: 10 })
      let all = [...first.items]
      if (first.totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: first.totalPages - 1 }, (_, i) =>
            listApplications({ page: i + 2, pageSize: 10 }).then(r => r.items).catch(() => [])
          )
        )
        all = [...all, ...rest.flat()]
      }
      setAllApps(all)
    } catch (err) {
      setError(err.message ?? 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // counts per status for tab badges
  const counts = useMemo(() => ({
    all:      allApps.length,
    pending:  allApps.filter(r => r.status === 'pending').length,
    approved: allApps.filter(r => r.status === 'approved').length,
    rejected: allApps.filter(r => r.status === 'rejected').length,
  }), [allApps])

  // filtered list
  const filtered = useMemo(() =>
    filter === 'all' ? allApps : allApps.filter(r => r.status === filter),
  [allApps, filter])

  // paginated slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart  = (page - 1) * PAGE_SIZE
  const list       = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  function handleFilterChange(f) { setFilter(f); setPage(1) }

  async function openDetail(r) {
    setSelected(r)
    setShowRejectInput(false)
    setRejectReason('')
    setDetailLoading(true)
    try {
      const full = await getApplication(r.id)
      setSelected(full)
    } catch { /* keep partial data */ }
    finally { setDetailLoading(false) }
  }

  async function approve(id) {
    setActionLoading(true)
    try {
      await approveApplication(id)
      setAllApps(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
      if (selected?.id === id) setSelected(p => ({ ...p, status: 'approved' }))
      showToast('Restaurant approved! Email sent to manager.')
    } catch (err) { showToast(err.message ?? 'Approval failed', 'error') }
    finally { setActionLoading(false) }
  }

  async function reject(id) {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason', 'error'); setShowRejectInput(true); return }
    setActionLoading(true)
    try {
      await rejectApplication(id, rejectReason)
      setAllApps(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
      if (selected?.id === id) setSelected(p => ({ ...p, status: 'rejected' }))
      setShowRejectInput(false); setRejectReason('')
      showToast('Restaurant rejected.')
    } catch (err) { showToast(err.message ?? 'Rejection failed', 'error') }
    finally { setActionLoading(false) }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="ra-page">
      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>,
        document.body
      )}

      {/* Filters + refresh */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={filter === f ? 'filter-btn filter-btn--active' : 'filter-btn'}>
            {capitalize(f)}
            {counts[f] > 0 && <span className="filter-count">{counts[f]}</span>}
          </button>
        ))}
        <button onClick={fetchAll}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9A9A9A', background: 'none', border: '1px solid #DDD6CC', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#9A9A9A' }}>Loading…</div>}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#E74C3C', fontSize: '14px' }}>
          {error}
          <button onClick={fetchAll} style={{ marginLeft: '12px', color: '#3DBF52', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Restaurant</th><th>Submitted</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#9A9A9A' }}>
                    No {filter !== 'all' ? filter : ''} applications found.
                  </td></tr>
                )}
                {list.map(r => (
                  <tr key={r.id} className="table-row" onClick={() => openDetail(r)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: r.logoColor + '22', color: r.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                          {r.logo}
                        </div>
                        <span style={{ fontWeight: 600 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#9A9A9A' }}>{r.submittedAt}</td>
                    <td><span className={`badge badge--${r.status}`}>{r.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {r.status === 'pending' && (
                          <>
                            <button className="icon-btn icon-btn--approve" onClick={() => approve(r.id)} title="Approve" disabled={actionLoading}><Check size={13} /></button>
                            <button className="icon-btn icon-btn--reject"  onClick={() => { setSelected(r); setShowRejectInput(true) }} title="Reject"><X size={13} /></button>
                          </>
                        )}
                        <button className="icon-btn icon-btn--view" onClick={() => openDetail(r)}><Eye size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9A9A9A' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #DDD6CC', background: page > 1 ? 'white' : '#F5EDE0', cursor: page > 1 ? 'pointer' : 'default', fontSize: '13px', color: page > 1 ? '#1C1C1E' : '#9A9A9A' }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #DDD6CC', background: page < totalPages ? 'white' : '#F5EDE0', cursor: page < totalPages ? 'pointer' : 'default', fontSize: '13px', color: page < totalPages ? '#1C1C1E' : '#9A9A9A' }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setShowRejectInput(false); setRejectReason('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: selected.logoColor + '22', color: selected.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                {selected.logo}
              </div>
              <div>
                <h2 className="modal-title">{selected.name}</h2>
                <p style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '2px' }}>
                  {selected.cuisine} · Submitted {selected.submittedAt}
                  {detailLoading && <span style={{ marginLeft: '8px', opacity: 0.6 }}>Loading details…</span>}
                </p>
              </div>
              <button className="modal-close" onClick={() => { setSelected(null); setShowRejectInput(false); setRejectReason('') }}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-field"><label>Owner</label><span>{selected.owner || '—'}</span></div>
                <div className="modal-field"><label>Email</label><span>{selected.email || '—'}</span></div>
                <div className="modal-field"><label>Phone</label><span>{selected.phone || '—'}</span></div>
                <div className="modal-field"><label>Branches</label><span>{selected.branchCount}</span></div>
                {selected.location && (
                  <div className="modal-field modal-field--full"><label>Location</label><span>{selected.location}</span></div>
                )}
                {selected.description && (
                  <div className="modal-field modal-field--full"><label>Description</label><span>{selected.description}</span></div>
                )}
                {selected.rejectionReason && (
                  <div className="modal-field modal-field--full">
                    <label style={{ color: '#E74C3C' }}>Rejection Reason</label>
                    <span style={{ color: '#E74C3C' }}>{selected.rejectionReason}</span>
                  </div>
                )}
                {selected.reviewedAt && (
                  <div className="modal-field modal-field--full">
                    <label>Reviewed At</label>
                    <span>{new Date(selected.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {showRejectInput && selected.status === 'pending' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#1C1C1E', display: 'block', marginBottom: '6px' }}>Rejection reason *</label>
                  <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Enter the reason for rejection…"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #DDD6CC', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selected.status === 'pending' ? (
                <>
                  {!showRejectInput
                    ? <button className="btn btn--reject" onClick={() => setShowRejectInput(true)}>Reject</button>
                    : <button className="btn btn--reject" onClick={() => reject(selected.id)} disabled={actionLoading}>{actionLoading ? 'Rejecting…' : 'Confirm Reject'}</button>
                  }
                  <button className="btn btn--approve" onClick={() => approve(selected.id)} disabled={actionLoading}>
                    {actionLoading ? 'Approving…' : 'Approve'}
                  </button>
                </>
              ) : (
                <p style={{ fontSize: '13px', color: '#9A9A9A' }}>
                  This application has been <strong>{selected.status}</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

export default RestaurantApplications
