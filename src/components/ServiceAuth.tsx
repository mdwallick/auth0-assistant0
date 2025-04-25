'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SERVICE_CONFIGS } from '@/lib/services'
import { toast } from 'sonner'
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

  const handleAuthClick = async () => {
    try {
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const userResponse = await fetch('/api/auth/me')
      const userData = await userResponse.json()
      const userId = encodeURIComponent(userData?.sub || '')

      const popup = window.open(
        `/auth/login?connection=${service}&ext-primary-user-id=${userId}`,
        'Auth0 Login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )

      if (!popup) {
        throw new Error('Please enable popups for this site')
      }

      await new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'AUTH_COMPLETE') {
            window.removeEventListener('message', messageHandler)
            resolve(true)
          } else if (event.data.type === 'AUTH_ERROR') {
            window.removeEventListener('message', messageHandler)
            reject(new Error(event.data.error))
          }
        }
        window.addEventListener('message', messageHandler)
      })

      await new Promise(resolve => setTimeout(resolve, 3000))
      setIsActive(true)
      toast.success(`Successfully connected to ${service}!`)
    } catch (error: any) {
      toast.error(`Failed to connect to ${service}: ${error.message}`)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button variant={isActive ? 'secondary' : 'default'} onClick={handleAuthClick}>
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  )
}