'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SUPPORTED_SERVICES } from '@/lib/services'
import { toast } from 'sonner'
import type { ConnectedService } from '@/lib/services'

interface ServiceAuthProps {
  service: string
}

export function ServiceAuth({ service }: ServiceAuthProps) {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user status')
        return res.json()
      })
      .then(data => {
        const connectedServices = data.connected_services || []
        setIsActive(connectedServices.some((cs: ConnectedService) => 
          cs.connection === SUPPORTED_SERVICES[service].connection
        ))
      })
      .catch(err => {
        console.error("Failed to check initial service status:", err)
      })
  }, [service])

  const handleAuthClick = async () => {
    setIsLoading(true)

    try {
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        `/api/auth/link?requested_connection=${SUPPORTED_SERVICES[service].connection}`,
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
            reject(new Error(event.data.error || 'Unknown error during authentication'))
          }
        }
        window.addEventListener('message', messageHandler)

        const intervalId = setInterval(() => {
          if (popup.closed) {
            clearInterval(intervalId)
            window.removeEventListener('message', messageHandler)
            console.log('Popup closed without completing auth message.')
          }
        }, 500)
      })

      toast.info('Authentication complete. Refreshing your session...')
      console.log('Auth complete message received. Refreshing session...')

      const refreshResponse = await fetch('/api/auth/update-session', { method: 'POST' })
      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        throw new Error(refreshData.error || `Failed to refresh session (${refreshResponse.status})`)
      }

      setIsActive(true)
      toast.success(`Successfully connected to ${service}! Session updated.`)

    } catch (error: any) {
      toast.error(`Failed to connect ${service}: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      {!isLoading && <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />}
      {isLoading && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Processing..."></span>}

      <Button variant={isActive ? 'secondary' : 'default'} onClick={handleAuthClick} disabled={isLoading}>
        {isLoading ? 'Processing...' : (isActive ? 'Re-authenticate' : 'Connect')}
      </Button>
    </div>
  )
}