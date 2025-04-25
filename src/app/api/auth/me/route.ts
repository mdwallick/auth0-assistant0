import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

export async function GET() {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = {
    ...session.user,
    connected_services: session.user['connected_services'] || [],
    id_token: session.tokenSet?.idToken || null,
  }

  //console.log('Full Session:', response)
  return NextResponse.json(response)
}
