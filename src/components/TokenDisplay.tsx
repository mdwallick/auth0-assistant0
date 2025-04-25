
'use client';

import { useState, useEffect } from 'react';

export function TokenDisplay() {
  const [idToken, setIdToken] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        return res.json();
      })
      .then(user => {
        console.log('User data:', user); // Debug log
        if (user.id_token) {
          const decoded = JSON.parse(atob(user.id_token.split('.')[1]));
          console.log('Decoded token:', decoded); // Debug log
          setIdToken(decoded);
        } else {
          setError('No ID token found');
        }
      })
      .catch(err => {
        console.error('Error fetching token:', err);
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

  if (!idToken) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900/20 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
        <p className="text-sm">Loading token data...</p>
      </div>
    );
  }

  return (
    <div className="bg-black/10 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
      <h3 className="font-mono text-sm mb-2">ID Token Claims:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(idToken, null, 2)}
      </pre>
    </div>
  );
}
