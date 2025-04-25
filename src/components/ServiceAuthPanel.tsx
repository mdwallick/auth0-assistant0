
import { useState, useEffect } from 'react'
import { ServiceAuth } from './ServiceAuth'
import type { SupportedService } from '@/lib/auth0'

export function ServiceAuthPanel() {
  const [connectedServices, setConnectedServices] = useState<SupportedService[]>([])

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
        <ServiceAuth service="microsoft" isActive={connectedServices.includes('microsoft')} />
        <ServiceAuth service="salesforce" isActive={connectedServices.includes('salesforce')} />
        <ServiceAuth service="google" isActive={connectedServices.includes('google')} />
      </div>
    </div>
  )
}
