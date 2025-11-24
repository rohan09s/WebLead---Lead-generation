import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, role }){
  const raw = localStorage.getItem('user')
  if (!raw) return <Navigate to="/login" replace />

  try{
    const user = JSON.parse(raw)
    if (role && user.role !== role) return <Navigate to="/unauthorized" replace />
    return children
  }catch(err){
    return <Navigate to="/login" replace />
  }
}
