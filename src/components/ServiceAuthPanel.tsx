
'use client'

import { useState, useEffect } from 'react'
import { ServiceAuth } from './ServiceAuth'
import type { ConnectedService } from '@/lib/services'

export function ServiceAuthPanel() {
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setConnectedServices(data.connected_services || [])
      })
      .catch(console.error)
  }, [])

  return (
    <div className="p-4 space-y-2 border rounded-lg">
      <h2 className="text-lg font-semibold">Connected Services</h2>
      <div className="space-y-2">
        <ServiceAuth service="microsoft" />
        <ServiceAuth service="salesforce" />
        <ServiceAuth service="google" />
      </div>
    </div>
  )
}
