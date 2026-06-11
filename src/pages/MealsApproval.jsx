import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, UtensilsCrossed } from 'lucide-react'
import { getUnreviewedMeals, getMealDetail, approveMeal } from '../services/restaurants'
import './MealsApproval.css'

const STORAGE_KEY = 'slyce_reviewed_meals'

function loadReviewed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
function saveReviewed(map) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
}

function MealsApproval() {
  const [meals, setMeals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected]         = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [toast, setToast]               = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const pending  = await getUnreviewedMeals()
      const pendingIds = new Set(pending.map(m => m.id))

      // merge with locally-stored reviewed meals (exclude any that are back in pending)
      const reviewed = Object.values(loadReviewed()).filter(m => !pendingIds.has(m.id))

      setMeals([...pending, ...reviewed])
    } catch (err) {
      setError(err.message ?? 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }

  async function openMeal(meal) {
    setSelected(meal)
    setSelectedDetail(null)
    setDetailLoading(true)
    try {
      const detail = await getMealDetail(meal.id)
      setSelectedDetail(detail)
    } catch {
      // detail fetch failed — modal still works with list data
    } finally {
      setDetailLoading(false)
    }
  }

  async function approve(id) {
    try {
      await approveMeal(id)
    } catch (err) {
      showToast(err.message ?? 'Approval failed', 'error')
      return
    }
    setMeals(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status: 'approved' } : m)
      const meal = updated.find(m => m.id === id)
      if (meal) {
        const map = loadReviewed()
        map[id] = meal
        saveReviewed(map)
      }
      return updated
    })
    if (selected?.id === id) {
      setSelected(prev => ({ ...prev, status: 'approved' }))
      setSelectedDetail(prev => prev ? { ...prev, status: 'approved' } : prev)
    }
    showToast('Meal approved!')
  }

  function reject(id) {
    setMeals(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status: 'rejected' } : m)
      const meal = updated.find(m => m.id === id)
      if (meal) {
        const map = loadReviewed()
        map[id] = meal
        saveReviewed(map)
      }
      return updated
    })
    if (selected?.id === id) {
      setSelected(prev => ({ ...prev, status: 'rejected' }))
      setSelectedDetail(prev => prev ? { ...prev, status: 'rejected' } : prev)
    }
    showToast('Meal rejected.', 'error')
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const pending  = meals.filter(m => m.status === 'pending')
  const approved = meals.filter(m => m.status === 'approved')
  const rejected = meals.filter(m => m.status === 'rejected')

  return (
    <div className="ma-page">
      {toast && createPortal(
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>,
        document.body
      )}

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="filter-btn filter-btn--active">
            Pending <span className="filter-count">{pending.length}</span>
          </span>
          {approved.length > 0 && (
            <span className="filter-btn">Approved <span className="filter-count">{approved.length}</span></span>
          )}
          {rejected.length > 0 && (
            <span className="filter-btn">Rejected <span className="filter-count">{rejected.length}</span></span>
          )}
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9A9A9A', background: 'none', border: '1px solid #DDD6CC', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9A9A' }}>Loading meals…</div>}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#E74C3C', fontSize: '14px' }}>
          {error}
          <button onClick={load} style={{ marginLeft: '10px', color: '#3DBF52', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      )}
      {!loading && !error && meals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9A9A', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <UtensilsCrossed size={36} color="#DDD6CC" />
          <p>No meals pending review.</p>
        </div>
      )}

      {/* pending */}
      {!loading && !error && pending.length > 0 && (
        <>
          <p className="section-label">Pending Review</p>
          <div className="meals-grid">
            {pending.map(m => <MealCard key={m.id} meal={m} onOpen={openMeal} onApprove={approve} onReject={reject} />)}
          </div>
        </>
      )}

      {/* approved */}
      {!loading && !error && approved.length > 0 && (
        <>
          <p className="section-label">Approved</p>
          <div className="meals-grid">
            {approved.map(m => <MealCard key={m.id} meal={m} onOpen={openMeal} onApprove={approve} onReject={reject} />)}
          </div>
        </>
      )}

      {/* rejected */}
      {!loading && !error && rejected.length > 0 && (
        <>
          <p className="section-label">Rejected</p>
          <div className="meals-grid">
            {rejected.map(m => <MealCard key={m.id} meal={m} onOpen={openMeal} onApprove={approve} onReject={reject} />)}
          </div>
        </>
      )}

      {selected && (
        <MealModal
          meal={{ ...selected, ...(selectedDetail ?? {}) }}
          loading={detailLoading}
          onClose={() => { setSelected(null); setSelectedDetail(null) }}
          onApprove={approve}
          onReject={reject}
        />
      )}
    </div>
  )
}

function MealCard({ meal, onOpen, onApprove, onReject }) {
  return (
    <div className="meal-card" onClick={() => onOpen(meal)}>
      {/* image */}
      <div style={{ height: '150px', background: '#EDE5D5', borderRadius: '14px 14px 0 0', overflow: 'hidden', position: 'relative' }}>
        {meal.imgUrl
          ? <img src={meal.imgUrl} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><UtensilsCrossed size={40} color="#DDD6CC" /></div>
        }
        <span className={`badge badge--${meal.status}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
          {meal.status}
        </span>
      </div>

      {/* info — flex: 1 absorbs extra height so restaurant row + buttons stay at bottom */}
      <div style={{ padding: '12px 14px 10px', flex: 1 }}>
        <h3 className="meal-name">{meal.name}</h3>
        {meal.description && <p className="meal-desc">{meal.description}</p>}
      </div>

      {/* restaurant row */}
      <div style={{ padding: '8px 14px 10px', borderTop: '1px solid #EDE5D5', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {meal.restaurantLogo && (
          <img src={meal.restaurantLogo} alt="" style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C1C1E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meal.restaurantName}
        </span>
        {meal.price != null && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1C1C1E', flexShrink: 0 }}>EGP {Number(meal.price).toLocaleString()}</span>
        )}
        {meal.calories != null && (
          <span style={{ fontSize: '11px', color: '#9A9A9A', flexShrink: 0 }}>{meal.calories} kcal</span>
        )}
      </div>

      {/* action buttons */}
      {meal.status === 'pending' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #DDD6CC' }}
          onClick={e => e.stopPropagation()}>
          <button className="meal-btn meal-btn--reject" onClick={() => onReject(meal.id)}>Reject</button>
          <button className="meal-btn meal-btn--approve" onClick={() => onApprove(meal.id)}>Approve</button>
        </div>
      )}
    </div>
  )
}

function MealModal({ meal, loading, onClose, onApprove, onReject }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="modal-header">
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', overflow: 'hidden', background: '#EDE5D5', flexShrink: 0 }}>
            {meal.imgUrl
              ? <img src={meal.imgUrl} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><UtensilsCrossed size={28} color="#DDD6CC" /></div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="modal-title">{meal.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              {meal.restaurantLogo && (
                <img src={meal.restaurantLogo} alt="" style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'cover' }} />
              )}
              <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{meal.restaurantName}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* full image */}
        {meal.imgUrl && (
          <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
            <img src={meal.imgUrl} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* body */}
        <div className="modal-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9A9A9A', fontSize: '13px' }}>
              Loading details…
            </div>
          )}
          <div className="modal-grid">
            {meal.submittedAt && (
              <div className="modal-field">
                <label>Submitted</label>
                <span>{meal.submittedAt}</span>
              </div>
            )}
            {meal.category && (
              <div className="modal-field">
                <label>Category</label>
                <span>{meal.category}</span>
              </div>
            )}
            {meal.description && (
              <div className="modal-field modal-field--full">
                <label>Description</label>
                <span style={{ lineHeight: 1.6 }}>{meal.description}</span>
              </div>
            )}

            {/* Sizes (price + calories) */}
            {meal.sizes && meal.sizes.length > 0 && (
              <div className="modal-field modal-field--full">
                <label>Sizes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {meal.sizes.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#EDE5D5', borderRadius: '9px', padding: '9px 13px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C1E', textTransform: 'capitalize' }}>
                        {s.name}
                      </span>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {s.calories != null && (
                          <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{s.calories} kcal</span>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1E' }}>
                          EGP {Number(s.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <div className="modal-field modal-field--full">
                <label>Ingredients</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {meal.ingredients.map((ing, i) => (
                    <span key={i} style={{
                      background: '#EDE5D5', borderRadius: '20px',
                      padding: '5px 12px', fontSize: '12px', color: '#1C1C1E',
                    }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="modal-footer">
          {meal.status === 'pending' ? (
            <>
              <button className="btn btn--reject" onClick={() => onReject(meal.id)}>Reject</button>
              <button className="btn btn--approve" onClick={() => onApprove(meal.id)}>Approve</button>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#9A9A9A' }}>
              This meal has been <strong>{meal.status}</strong>.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

export default MealsApproval
