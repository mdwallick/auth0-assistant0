import { useState, useEffect } from 'react'
import { ServiceAuth } from './ServiceAuth'

export function ServiceAuthPanel() {
  const activeServices = useConnectedServices()

  return (
    <div className="p-4 space-y-2 border rounded-lg">
      <h2 className="text-lg font-semibold">Connected Services</h2>
      <div className="space-y-2">
        <ServiceAuth service="microsoft" isActive={activeServices.includes('microsoft')} />
        <ServiceAuth service="salesforce" isActive={activeServices.includes('salesforce')} />
        <ServiceAuth service="google" isActive={activeServices.includes('google')} />
      </div>
    </div>
  )
}
