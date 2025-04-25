
'use client';

import { useState, useEffect } from 'react';

export function TokenDisplay() {
  const [idToken, setIdToken] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(user => {
        if (user.id_token) {
          setIdToken(JSON.parse(atob(user.id_token.split('.')[1])));
        }
      })
      .catch(console.error);
  }, []);

  if (!idToken) return null;

  return (
    <div className="bg-black/10 p-4 rounded-lg max-w-[768px] mx-auto mb-4">
      <h3 className="font-mono text-sm mb-2">ID Token Claims:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(idToken, null, 2)}
      </pre>
    </div>
  );
}
