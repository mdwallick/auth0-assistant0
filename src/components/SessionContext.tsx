'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { SessionData } from '@auth0/nextjs-auth0/types'

export const SessionContext = createContext<SessionData | null>(null)

interface SessionProviderProps {
  session: SessionData | null
  children: ReactNode
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
