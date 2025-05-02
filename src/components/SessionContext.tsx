'use client'

import { createContext, useContext } from 'react'

export const SessionContext = createContext(null)

export function SessionProvider({ session, children }) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
