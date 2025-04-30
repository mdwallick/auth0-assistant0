import { NextResponse } from 'next/server'
import { getConnectedServices } from '@/lib/auth0'

export async function GET() {
  const activeServices = await getConnectedServices()
  const allServices = ['microsoft', 'salesforce', 'google']
  const inactiveServices = allServices.filter(svc => !activeServices.includes(svc))

  return NextResponse.json({
    activeServices,
    inactiveServices,
    status: allServices.map(service => ({
      name: service,
      active: activeServices.includes(service),
      status: activeServices.includes(service) ? '✅ Connected' : '❌ Not Connected'
    }))
  })
}