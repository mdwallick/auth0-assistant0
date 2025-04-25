import { ManagementClient } from 'auth0'
import { PostIdentitiesRequestProviderEnum } from 'auth0'

const mgmtClient = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
})

export type IdentityToLink = {
  provider: PostIdentitiesRequestProviderEnum;
  user_id: string;
  connection_id?: string;
}

export async function linkUser(userId: string, identity: IdentityToLink) {
  await mgmtClient.users.link({ id: userId }, identity)
}
