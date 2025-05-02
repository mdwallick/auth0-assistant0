
import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { mapConnectionToName } from '@/lib/types'
import type { ConnectedService } from '@/lib/types'

export async function GET() {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Map the identities to ConnectedService type
  const user_id = session.user.user_id.split('|')[1]
  const orig_identities = session.user.identities.filter((id: ConnectedService) => id.user_id !== user_id)
  const mappedIdentities: ConnectedService[] = orig_identities?.map((identity: ConnectedService) => ({
    name: mapConnectionToName(identity.connection),
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
