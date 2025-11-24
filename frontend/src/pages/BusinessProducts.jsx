import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Link, useNavigate } from 'react-router-dom'

export default function BusinessProducts(){
  const nav = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  useEffect(()=>{ load() }, [])

  async function load(){
    try{
      setLoading(true)
      const res = await api.get('/api/business/products')
      setProducts(res.data)
    }catch(err){
      console.error('Failed to load products', err)
      alert(err?.response?.data?.error || 'Failed to load products')
    }finally{ setLoading(false) }
  }

  async function remove(id){
    if (!confirm('Delete this product?')) return
    try{
      await api.delete('/api/business/products/'+id)
      setProducts(p=>p.filter(x=>x._id!==id))
    }catch(err){ alert('Delete failed: '+(err?.response?.data?.error||err.message)) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Products</h2>
        <Link to="/business/products/new" className="btn-primary">Add Product</Link>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <input placeholder="Search name or SKU" value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} className="border rounded-md px-3 py-2" />
              <input placeholder="min price" value={minPrice} onChange={e=>{ setMinPrice(e.target.value); setCurrentPage(1) }} className="border rounded-md px-2 py-2 w-24" />
              <input placeholder="max price" value={maxPrice} onChange={e=>{ setMaxPrice(e.target.value); setCurrentPage(1) }} className="border rounded-md px-2 py-2 w-24" />
            </div>
            <div>
              {/* Primary CTA kept above the title; remove duplicate button here */}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="card">No products yet. <Link to="/business/products/new" className="text-blue-600">Add one</Link></div>
          ) : (
            (() => {
              const filtered = products.filter(p=>{
                const q = search.trim().toLowerCase();
                if (q){
                  const ok = (p.name||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)
                  if (!ok) return false
                }
                const pnum = Number(p.price || 0)
                if (minPrice !== '' && !isNaN(Number(minPrice)) && pnum < Number(minPrice)) return false
                if (maxPrice !== '' && !isNaN(Number(maxPrice)) && pnum > Number(maxPrice)) return false
                return true
              })

              const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
              const start = (currentPage - 1) * ITEMS_PER_PAGE
              const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE)

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pageItems.map(p=> (
                      <div key={p._id} className="card flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} alt={p.name} className="w-20 h-20 object-cover rounded" />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">No image</div>
                          )}

                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-sm text-slate-600">SKU: {p.sku || '—'} • Qty: {p.quantity || 0}</div>
                            <div className="text-sm text-slate-700">{p.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={'/business/products/'+p._id+'/edit'} className="nav-link">Edit</Link>
                          <button onClick={()=>remove(p._id)} className="btn-logout">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button disabled={currentPage<=1} onClick={()=>setCurrentPage(s=>Math.max(1,s-1))} className="nav-link">Prev</button>
                    <div className="text-sm text-slate-600">Page {currentPage} / {totalPages}</div>
                    <button disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(s=>Math.min(totalPages,s+1))} className="nav-link">Next</button>
                  </div>
                </>
              )
            })()
          )}
        </>
      )}
    </div>
  )
}
