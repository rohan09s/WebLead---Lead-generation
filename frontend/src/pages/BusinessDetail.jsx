import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'

export default function BusinessDetail(){
  const { id } = useParams()
  const [biz, setBiz] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name:'', phone:'', message:'' })
  const navigate = useNavigate()
  const location = useLocation()
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setForm(f=>({ ...f, email: u.email || '' }))
      } catch(_){}
    }
  },[])

  useEffect(()=>{
    api.get('/api/businesses/'+id).then(r=>setBiz(r.data)).catch(()=>setBiz(null))
    // load public products for this business
    api.get('/api/businesses/'+id+'/products').then(r=>setProducts(r.data || [])).catch(()=>setProducts([]))
  },[id])

  // Apply prefill when navigated with product state (from an Enquire click)
  useEffect(()=>{
    const st = location.state
    if (st && st.prefillProduct){
      const p = st.prefillProduct
      const bizName = st.businessName || (biz && biz.name) || ''
      const message = `I am interested in buying ${p.name}${p.sku ? ` (SKU: ${p.sku})` : ''} from ${bizName}. Please share details.`
      setForm(f=>({ ...f, message }))
      setTimeout(()=>{
        try{ formRef.current && formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) }catch(e){}
      }, 120)
      try{ window.history.replaceState({}, document.title, window.location.pathname + window.location.search) }catch(e){}
    }
  }, [location, biz])

  async function submit(e){
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')

    try {
      setLoading(true)
      await api.post('/api/leads', {...form, businessId: id})
      alert('Inquiry sent!')
      navigate('/dashboard')
    } catch(err){
      alert('Failed: '+ (err?.response?.data?.error || err.message))
    } finally{ setLoading(false) }
  }

  if (!biz) return <div>Loading business...</div>
  return (
    <div>
      <div className="card" style={{padding:20}}>
        <h2>{biz.name}</h2>
        <div style={{color:'#555'}}>{biz.category} · {biz.location}</div>
        <p>{biz.description}</p>
      </div>

      {products && products.length > 0 && (
        <div style={{marginTop:18}}>
          <h3>Products</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginTop:8}}>
            {products.map(p=> (
              <div key={p._id} className="card" style={{padding:12}}>
                {p.images && p.images.length > 0 ? (
                  <a href={p.images[0]} target="_blank" rel="noopener noreferrer">
                    <img src={p.images[0]} alt={p.name} style={{width:'100%', height:140, objectFit:'cover', borderRadius:6}} />
                  </a>
                ) : null}
                <div style={{marginTop:8}}>
                  <div style={{fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:13, color:'#555'}}>{p.sku ? `SKU: ${p.sku}` : ''}</div>
                  <div style={{marginTop:8}}>{p.description}</div>
                  <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontWeight:700}}>{typeof p.price === 'number' ? `₹${p.price}` : ''}</div>
                    <button onClick={()=> navigate(location.pathname + '#inquiry', { state: { prefillProduct: p, businessName: biz?.name } })} className="btn-primary">Enquire</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{marginTop:18}}>Send an inquiry to {biz.name}</h3>
      <form id="inquiry" ref={formRef} onSubmit={submit} style={{maxWidth:480}}>
        <div style={{marginBottom:8}}>
          <input required placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:'100%', padding:8}}/>
        </div>
        <div style={{marginBottom:8}}>
          <input required placeholder="Email" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})} style={{width:'100%', padding:8}}/>
        </div>
        <div style={{marginBottom:8}}>
          <input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} style={{width:'100%', padding:8}}/>
        </div>
        <div style={{marginBottom:8}}>
          <textarea placeholder="Message (optional)" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} style={{width:'100%', padding:8}} rows={4}/>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Inquiry'}</button>
      </form>
    </div>
  )
}