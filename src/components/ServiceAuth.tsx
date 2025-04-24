
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Service = 'microsoft' | 'salesforce' | 'google';

interface ServiceAuthProps {
  service: Service;
  isActive: boolean;
}

export function ServiceAuth({ service, isActive }: ServiceAuthProps) {
  const handleAuth = async () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/api/auth/${service}`,
      'Auth0 Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      toast.error('Please enable popups for this site');
      return;
    }

    // Poll for popup closure
    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(pollTimer);
        window.location.reload(); // Refresh to update auth state
      }
    }, 200);
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button variant={isActive ? 'secondary' : 'default'} onClick={handleAuth}>
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  );
}
