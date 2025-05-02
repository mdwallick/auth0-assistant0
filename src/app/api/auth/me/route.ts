import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import type { ConnectedService } from '@/lib/types'

export async function GET() {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = {
    ...session.user,
    identities: session.user.identities || [],
    //id_token: session.tokenSet?.idToken || null,
  }
  
  return NextResponse.json(response)
}
