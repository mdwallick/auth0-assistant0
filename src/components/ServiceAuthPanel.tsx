
'use client'

import { ServiceAuth } from './ServiceAuth'

export function ServiceAuthPanel() {
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
