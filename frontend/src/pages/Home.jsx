import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Link } from 'react-router-dom'

function BusinessCard({b}){
  return (
    <div className="card" style={{marginBottom:12}}>
      <h3 style={{margin:'0 0 6px 0'}}>{b.name}</h3>
      <div style={{fontSize:13, color:'#555'}}>{b.category} · {b.location}</div>
      <p style={{marginTop:8}}>{b.description}</p>
      <Link to={'/business/'+b._id}>View & Enquire</Link>
    </div>
  )
}

export default function Home(){
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    api.get('/api/businesses').then(r=>{
      setBusinesses(r.data)
    }).catch(console.error).finally(()=>setLoading(false))
  },[])

  return (
    <div>
      <h1>Find Suppliers & Services</h1>
      {loading ? <div>Loading...</div> : (
        <div>
          {businesses.map(b=> <BusinessCard key={b._id} b={b} />)}
        </div>
      )}
    </div>
  )
}