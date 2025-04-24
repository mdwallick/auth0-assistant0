
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ServiceAuth } from './ServiceAuth';
import { useState } from 'react';

interface ServiceAuthDialogProps {
  service: 'microsoft' | 'salesforce' | 'google';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceAuthDialog({ service, isOpen, onOpenChange }: ServiceAuthDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Connect {service}</h2>
          <ServiceAuth service={service} isActive={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
