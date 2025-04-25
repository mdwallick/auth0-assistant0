
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import type { SupportedService } from '@/lib/auth0'

interface ServiceAuthProps {
  service: SupportedService
  isActive: boolean
}

export function ServiceAuth({ service, isActive }: ServiceAuthProps) {
  const handleAuth = async () => {
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `/api/auth/${service}`,
      'Auth0 Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
    )

    if (!popup) {
      toast.error('Please enable popups for this site')
      return
    }

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(pollTimer)
        window.location.reload()
      }
    }, 200)
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button variant={isActive ? 'secondary' : 'default'} onClick={handleAuth}>
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  )
}
