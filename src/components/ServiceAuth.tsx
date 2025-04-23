
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Service = 'microsoft' | 'salesforce' | 'google'

interface ServiceAuthProps {
  service: Service
  isActive: boolean
}

export function ServiceAuth({ service, isActive }: ServiceAuthProps) {
  const handleAuth = async () => {
    let connection: string
    switch (service) {
      case 'microsoft':
        connection = 'windowslive'
        break
      case 'salesforce':
        connection = 'salesforce-dev'
        break
      case 'google':
        connection = 'google-oauth2'
        break
      default:
        throw new Error(`Invalid service ${service}`)
    }

    window.location.href = `/auth/login?connection=${connection}`
    // try {
    //   const response = await fetch(`/api/auth/${service}`, {
    //     method: 'POST'
    //   })
      
    //   if (!response.ok) {
    //     throw new Error(`Failed to authenticate with ${service}`)
    //   }
      
    //   const data = await response.json()
    //   window.location.href = data.authUrl
    // } catch (error: any) {
    //   toast.error(`Authentication failed: ${error.message}`)
    // }
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="capitalize">{service}</span>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      <Button 
        variant={isActive ? "secondary" : "default"}
        onClick={handleAuth}
      >
        {isActive ? 'Re-authenticate' : 'Connect'}
      </Button>
    </div>
  )
}
