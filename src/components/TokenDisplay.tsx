'use client'

import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function TokenDisplay() {
  const { data: session, error, mutate } = useSWR('/api/auth/me', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false
  })

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
        <p className="text-sm text-red-600 dark:text-red-400">Error: {error.message}</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900/20 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
        <p className="text-sm">Loading session data...</p>
      </div>
    )
  }

  return (
    <div className="bg-black/10 p-4 rounded-lg w-full h-[calc(100vh-20rem)] flex flex-col">
      <h3 className="font-mono text-sm mb-2">Session Data:</h3>
      <div className="flex-1 overflow-auto">
        <pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  )
}