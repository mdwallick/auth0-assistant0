
import { NextResponse } from 'next/server'
import { serviceRegistry } from '@/lib/service-registry'

export async function GET() {
  const activeServices = serviceRegistry.getActiveServices()
  
  return NextResponse.json({
    activeServices
  })
}
