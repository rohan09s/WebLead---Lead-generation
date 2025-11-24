import React from 'react'
import { Link } from 'react-router-dom'

export default function Unauthorized(){
  return (
    <div>
      <h2>Unauthorized</h2>
      <p>You do not have permission to view this page.</p>
      <p><Link to="/">Go Home</Link></p>
    </div>
  )
}
