
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ServiceAuth } from './ServiceAuth'
import type { SupportedService } from '@/lib/services'

interface ServiceAuthDialogProps {
  service: SupportedService
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceAuthDialog({ service, isOpen, onOpenChange }: ServiceAuthDialogProps) {
  if (!service) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Connect {service}</h2>
          <ServiceAuth service={service} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
