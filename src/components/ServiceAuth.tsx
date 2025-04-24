import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Service = 'microsoft' | 'salesforce' | 'google';

interface ServiceAuthProps {
  service: Service;
  isActive: boolean;
}

export function ServiceAuth({ service, isActive }: ServiceAuthProps) {
  const handleAuth = async () => {
    let connection: string
    let scopes: string
    
    switch (service) {
      case 'microsoft':
        connection = 'windowslive';
        scopes = 'openid profile email offline_access User.Read Mail.Read Mail.ReadWrite Calendars.ReadWrite Files.ReadWrite.All';
        break;
      case 'salesforce':
        connection = 'salesforce-dev';
        scopes = 'openid profile email offline_access api';
        break;
      case 'google':
        connection = 'google-oauth2';
        scopes = 'openid profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar';
        break;
      default:
        throw new Error(`Invalid service ${service}`);
    }

    try {
      window.location.href = `/auth/login?connection=${connection}&scope=${scopes}`;
    } catch (error: any) {
      toast.error(`Authentication failed: ${error.message}`);
    }
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
