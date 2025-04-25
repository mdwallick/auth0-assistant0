'use client';

import { useState, useEffect } from 'react'

function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

export function TokenDisplay() {
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        return res.json();
      })
      .then(data => {
        console.log('Session data:', data);
        setSession(data);
      })
      .catch(err => {
        console.error('Error fetching session:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
        <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900/20 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
        <p className="text-sm">Loading session data...</p>
      </div>
    );
  }

  const decoded_jwt = session ? decodeJwt(session.id_token) : null
  
  return (
    <div className="bg-black/10 p-4 rounded-lg w-full h-full overflow-hidden">
      <h3 className="font-mono text-sm mb-2">Session Data:</h3>
      <pre className="text-xs overflow-auto h-[calc(100%-2rem)]">
        {JSON.stringify(session, null, 2)}
        <br/><br/>
        {JSON.stringify(decoded_jwt, null, 2)}
      </pre>

    </div>
);
}