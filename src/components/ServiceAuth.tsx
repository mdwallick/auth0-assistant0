'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SERVICE_CONFIGS } from '@/lib/services'

import type { SupportedService } from '@/lib/services'

interface ServiceAuthProps {
  service: SupportedService
}

export function ServiceAuth({ service }: ServiceAuthProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        const connectedServices = data.connected_services || []
        setIsActive(connectedServices.some(cs => cs.connection === SERVICE_CONFIGS[service].connection))
      })
      .catch(console.error)
  }, [service])

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button variant={isActive ? 'secondary' : 'default'}>
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  )
}
