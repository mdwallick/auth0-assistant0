import { ManagementClient } from 'auth0'
import { PostIdentitiesRequestProviderEnum } from 'auth0'

const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  scope: 'read:users update:users read:users_app_metadata',
});

export type IdentityToLink = {
  provider: PostIdentitiesRequestProviderEnum;
  user_id: string;
  connection_id?: string;
};

export async function linkUser(userId: string, identity: IdentityToLink) {
  await auth0.users.link({ id: userId }, identity);
}