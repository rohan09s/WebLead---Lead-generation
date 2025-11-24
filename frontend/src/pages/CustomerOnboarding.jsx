import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

export default function CustomerOnboarding(){
  const nav = useNavigate()
  const raw = localStorage.getItem('user')
  const user = raw ? JSON.parse(raw) : null

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    if (!localStorage.getItem('token')) nav('/login')
  },[])

  async function saveProfile(e){
    e.preventDefault()
    setError('')
    if (!name) return setError('Name is required')
    try{
      setLoading(true)
      const res = await api.put('/api/auth/profile', { name, phone, address, bio })
      // update local user
      const updated = res.data.user
      localStorage.setItem('user', JSON.stringify(updated))
      nav('/')
    }catch(err){
      setError(err?.response?.data?.error || err.message)
    }finally{setLoading(false)}
  }

  return (
    <div style={{padding:20}}>
      <h2>Welcome — Complete your profile</h2>
      <p>Please provide a few details so we can personalize your experience.</p>
      <form onSubmit={saveProfile} style={{maxWidth:600}}>
        <div>
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <input placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div>
          <input placeholder="Address (optional)" value={address} onChange={e=>setAddress(e.target.value)} />
        </div>
        <div>
          <textarea placeholder="Short bio (optional)" value={bio} onChange={e=>setBio(e.target.value)} rows={4} />
        </div>
        {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
        <div style={{marginTop:10}}>
          <button disabled={loading}>{loading ? 'Saving…' : 'Save and Continue'}</button>
        </div>
      </form>
    </div>
  )
}
