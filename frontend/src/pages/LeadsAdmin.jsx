import React, { useEffect, useState } from 'react'
import { api } from '../api'
import LeadCard from './LeadCard'
import { useNavigate } from 'react-router-dom'

export default function LeadsAdmin(){
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(()=>{
    const raw = localStorage.getItem('user')
    if (!raw) return nav('/login')
    try {
      const u = JSON.parse(raw)
      if (u.role !== 'admin') return nav('/unauthorized')
    } catch(_) { return nav('/login') }

    api.get('/api/leads').then(r=>setLeads(r.data)).catch(err=>{
      alert('Failed to fetch leads: '+ (err?.response?.data?.error || err.message))
    }).finally(()=>setLoading(false))
  },[])

  if (loading) return <div>Loading leads...</div>

  return (
    <div>
      <h2>All Leads</h2>
      <div style={{marginTop:12}}>
        {leads.length === 0 && <div>No leads yet</div>}
        {leads.map(l=> <LeadCard key={l._id || l.id} lead={l} />)}
      </div>
    </div>
  )
}
