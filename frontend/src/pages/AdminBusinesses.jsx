import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

export default function AdminBusinesses(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(()=>{
    const raw = localStorage.getItem('user')
    if (!raw) return nav('/login')
    try{
      const u = JSON.parse(raw)
      if (u.role !== 'admin') return nav('/unauthorized')
    }catch(e){ return nav('/login') }

    api.get('/api/admin/businesses').then(r=>setItems(r.data)).catch(err=>{
      alert('Failed to load businesses: '+(err?.response?.data?.error||err.message))
    }).finally(()=>setLoading(false))
  },[])

  async function onEdit(b){
    const name = prompt('Name', b.name) || b.name
    const category = prompt('Category', b.category||'') || b.category
    const location = prompt('Location', b.location||'') || b.location
    const description = prompt('Description', b.description||'') || b.description
    try{
      const res = await api.put('/api/admin/businesses/'+b._id, { name, category, location, description })
      setItems(items.map(x=> x._id===b._id ? res.data : x))
    }catch(err){ alert('Failed to update: '+(err?.response?.data?.error||err.message)) }
  }

  async function onDelete(b){
    if (!confirm('Delete business '+b.name+'?')) return
    try{
      await api.delete('/api/admin/businesses/'+b._id)
      setItems(items.filter(x=> x._id!==b._id))
    }catch(err){ alert('Failed to delete: '+(err?.response?.data?.error||err.message)) }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Manage Businesses</h2>
      {items.length===0 && <div>No businesses</div>}
      <div style={{marginTop:12}}>
        {items.map(b=> (
          <div key={b._id} style={{padding:12, border:'1px solid #eee', marginBottom:8, borderRadius:6}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <strong>{b.name}</strong>
                <div style={{color:'#666'}}>{b.category} · {b.location}</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button onClick={()=>onEdit(b)}>Edit</button>
                <button onClick={()=>onDelete(b)}>Delete</button>
              </div>
            </div>
            <div style={{marginTop:8}}>{b.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
