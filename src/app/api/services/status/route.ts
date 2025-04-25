import { getConnectedServices } from '@/lib/auth0'
import { NextResponse } from 'next/server'

export async function GET() {
  const activeServices = await getConnectedServices()
  return NextResponse.json({
    activeServices,
  })
}
