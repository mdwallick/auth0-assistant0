
import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import type { ConnectedService } from '@/lib/types'

export async function GET() {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Map the identities to ConnectedService type
  const mappedIdentities: ConnectedService[] = session.user.identities?.map(identity => ({
    name: identity.name || '',
    provider: identity.provider,
    user_id: identity.user_id,
    connection: identity.connection,
    isSocial: identity.isSocial || false
  })) || []

  const response = {
    ...session.user,
    identities: mappedIdentities
  }
  
  return NextResponse.json(response)
}
