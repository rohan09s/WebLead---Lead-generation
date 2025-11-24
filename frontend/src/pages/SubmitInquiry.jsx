import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

export default function SubmitInquiry(){
  const nav = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const raw = localStorage.getItem('user')
  const user = raw ? JSON.parse(raw) : null

  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', message: '', businessId: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(()=>{
    api.get('/api/businesses').then(r=>{
      setBusinesses(r.data)
      setLoading(false)
    }).catch(err=>{
      console.error('Failed to load businesses', err)
      setLoading(false)
    })
  },[])

  function validate(){
    const e = {}
    if (!form.businessId) e.businessId = 'Please select a business'
    if (!form.name) e.name = 'Name required'
    if (!form.email) e.email = 'Email required'
    if (!form.phone) e.phone = 'Phone required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e){
    e.preventDefault()
    if (!validate()) return
    // require login
    const token = localStorage.getItem('token')
    if (!token) return nav('/login')

    try{
      setSubmitting(true)
      await api.post('/api/leads', { name: form.name, email: form.email, phone: form.phone, message: form.message, businessId: form.businessId })
      alert('Inquiry sent')
      nav('/dashboard')
    }catch(err){
      alert('Failed: '+(err?.response?.data?.error || err.message))
    }finally{ setSubmitting(false) }
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8">Loading businesses...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Send an Inquiry</h2>
        <p className="text-sm text-slate-600">Fill in the form below and we'll send your inquiry to the selected business.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Business</label>
          <select value={form.businessId} onChange={e=>setForm({...form, businessId:e.target.value})} className="mt-1 block w-full border rounded-md px-3 py-2">
            <option value="">-- Select business --</option>
            {businesses.map(b=> <option key={b._id} value={b._id}>{b.name} — {b.category} ({b.location})</option>)}
          </select>
          {errors.businessId && <div className="text-sm text-red-600 mt-1">{errors.businessId}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Your name</label>
          <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          {errors.name && <div className="text-sm text-red-600 mt-1">{errors.name}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          {errors.email && <div className="text-sm text-red-600 mt-1">{errors.email}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          {errors.phone && <div className="text-sm text-red-600 mt-1">{errors.phone}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Message (optional)</label>
          <textarea className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Message (optional)" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} rows={4} />
        </div>

        <div>
          <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md">{submitting ? 'Sending…' : 'Send Inquiry'}</button>
        </div>
      </form>
    </div>
  )
}
