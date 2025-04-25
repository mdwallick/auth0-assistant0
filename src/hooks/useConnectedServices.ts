
import { useState, useEffect } from 'react';
import type { SupportedService } from '@/lib/auth0';

export function useConnectedServices() {
  const [connectedServices, setConnectedServices] = useState<SupportedService[]>([]);

  useEffect(() => {
    fetch('/api/services/status')
      .then(res => res.json())
      .then(data => setConnectedServices(data.activeServices))
      .catch(console.error);
  }, []);

  return connectedServices;
}
