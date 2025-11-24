import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useNavigate, useParams } from 'react-router-dom'

export default function AddProduct(){
  const nav = useNavigate()
  const params = useParams()
  const editingId = params.id

  const [form, setForm] = useState({ name:'', sku:'', price:'', quantity:'', description:'' })
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  useEffect(()=>{
    if (editingId) load()
  }, [editingId])

  const fileInputRef = useRef(null)

  async function uploadFiles(files){
    try{
      setUploading(true)
      setUploadProgress(0)
      const fd = new FormData()
      files.forEach(f=>fd.append('images', f))
      const res = await api.post('/api/business/products/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded * 100) / ev.total)
            setUploadProgress(pct)
          }
        }
      })
      setImages(prev => [...prev, ...(res.data.urls || [])])
    }catch(err){
      alert('Upload failed: '+(err?.response?.data?.error||err.message))
    }finally{
      setUploading(false)
      setTimeout(()=>setUploadProgress(0), 400)
    }
  }

  async function load(){
    try{
      setLoading(true)
      const res = await api.get('/api/business/products/'+editingId)
      setForm({ name: res.data.name || '', sku: res.data.sku || '', price: res.data.price || '', quantity: res.data.quantity || '', description: res.data.description || '' })
      setImages(res.data.images || [])
    }catch(err){
      alert('Failed to load product');
    }finally{ setLoading(false) }
  }

  async function submit(e){
    e.preventDefault()
    try{
      setLoading(true)
      const payload = { ...form, price: Number(form.price||0), quantity: Number(form.quantity||0), images }
      if (editingId){
        await api.put('/api/business/products/'+editingId, payload)
        alert('Updated')
      } else {
        await api.post('/api/business/products', payload)
        alert('Created')
      }
      nav('/business/products')
    }catch(err){
      alert('Save failed: '+(err?.response?.data?.error||err.message))
    }finally{ setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 block w-full border rounded-md px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input className="mt-1 block w-full border rounded-md px-3 py-2" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input type="number" className="mt-1 block w-full border rounded-md px-3 py-2" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input type="number" className="mt-1 block w-full border rounded-md px-3 py-2" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 block w-full border rounded-md px-3 py-2" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={4}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Images</label>
            <div className="mt-2">
              <div
                onDragOver={(e)=>{ e.preventDefault(); setDragActive(true) }}
                onDragLeave={(e)=>{ e.preventDefault(); setDragActive(false) }}
                onDrop={async (e)=>{
                  e.preventDefault(); setDragActive(false)
                  const files = Array.from(e.dataTransfer.files || [])
                  if (files.length === 0) return
                  await uploadFiles(files)
                }}
                className={`border-dashed border-2 rounded-md p-4 flex items-center justify-center cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-sm text-slate-600">Drag & drop images here, or <span onClick={()=>fileInputRef.current && fileInputRef.current.click()} className="text-blue-600 underline cursor-pointer">browse</span></div>
                  <input ref={fileInputRef} type="file" multiple onChange={async (e)=>{ const files = Array.from(e.target.files || []); if(files.length) await uploadFiles(files); }} style={{display:'none'}} />
                </div>
              </div>

              <div className="mt-2">
                {uploading && (
                  <div className="text-sm text-slate-600">Uploading… {uploadProgress}%</div>
                )}
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {images.map((u, idx)=> (
                  <div key={idx} style={{width:80, height:80, borderRadius:6, overflow:'hidden', border:'1px solid #e6e6e6', position:'relative'}}>
                    <img src={u} alt={`img-${idx}`} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    <button onClick={()=>setImages(prev=>prev.filter((x,i)=>i!==idx))} style={{position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:4, padding:'2px 6px', cursor:'pointer'}}>x</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
