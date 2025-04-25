import { Button } from '@/components/ui/button'
import type { SupportedService } from '@/lib/auth0'

interface ServiceAuthProps {
  service: SupportedService
  isActive: boolean
}

export function ServiceAuth({ service, isActive }: ServiceAuthProps) {

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button variant={isActive ? 'secondary' : 'default'}>
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  )
}
