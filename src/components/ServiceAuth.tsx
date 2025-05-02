'use client'

import { useState } from 'react'
import { useSession } from '@/components/SessionContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { SUPPORTED_SERVICES } from '@/lib/types'
import type { ConnectedService } from '@/lib/types'

export function ServiceAuth({ service }: { service: keyof typeof SUPPORTED_SERVICES }) {
  const session = useSession()
  const user = session?.user
  const [isLoading, setIsLoading] = useState(false)

  const isActive = (user?.identities as ConnectedService[])?.some(identity => 
    identity.connection === SUPPORTED_SERVICES[service].connection
  ) || false
  
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
      })

      toast.info('Authentication complete. Refreshing your session...')

      const refreshResponse = await fetch('/api/auth/update-session', { method: 'POST' })
      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        throw new Error(refreshData.error || `Failed to refresh session (${refreshResponse.status})`)
      }

      toast.success(`Successfully connected to ${SUPPORTED_SERVICES[service].displayName}!`)

    } catch (error: any) {
      toast.error(`Failed to connect ${SUPPORTED_SERVICES[service].displayName}: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{SUPPORTED_SERVICES[service].displayName}</span>
      {!isLoading && <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />}
      {isLoading && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Processing..."></span>}

      <Button variant={isActive ? 'secondary' : 'default'} onClick={handleAuthClick} disabled={isLoading}>
        {isLoading ? 'Processing...' : (isActive ? 'Re-authenticate' : 'Connect')}
      </Button>
    </div>
  )
}
