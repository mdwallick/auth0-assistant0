import { NextRequest, NextResponse } from 'next/server'
import { AccessTokenError } from '@auth0/nextjs-auth0/errors'
import type { SessionData } from '@auth0/nextjs-auth0/types'
import { ManagementClient } from 'auth0'
import { auth0 } from "@/lib/auth0"
import type { ConnectedService } from "@/lib/services"

// Define a type for the expected UserInfo shape from /userinfo
interface UserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: {
    country?: string;
    // Add other address fields if needed
  };
  updated_at?: number;
  // Add any custom claims expected from /userinfo
  connected_services?: Array<ConnectedService>
  [key: string]: any; // Allow other properties
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // App Router Route Handlers don't need the explicit req/res for Auth0 SDK helpers
  try {
    // 1. Get the current session
    // getSession() reads cookies from the request implicitly in App Router
    const session = await auth0.getSession();
    if (!session?.user?.sub) { // Check for user and sub presence
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Get an Access Token (needed for /userinfo)
    let accessToken: { token: string; expiresAt: number; scope?: string | undefined; }
    try {
      // getAccessToken() also reads cookies implicitly
      accessToken = await auth0.getAccessToken()

      if (!accessToken) {
        // This might happen if scopes aren't sufficient or other config issues
         return NextResponse.json({ error: 'Could not retrieve access token for user.' }, { status: 401 });
      }

    } catch (error) {
      console.error('Error getting access token for session update:', error);
      // Handle specific token errors (e.g., needs login)
      if (error instanceof AccessTokenError) {
        return NextResponse.json(
          { error: `Access Token Error: ${error.message}`, code: error.code },
          { status: 401 }
        );
      }
      // Rethrow unexpected errors
      throw error;
    }

    //console.log('Access token', accessToken)
    
    // 3. Fetch the latest user profile from Auth0's /userinfo endpoint
    const issuerBaseUrl = process.env.AUTH0_DOMAIN;
    if (!issuerBaseUrl) {
        throw new Error("AUTH0_ISSUER_BASE_URL environment variable not set.");
    }

    // Get latest user data from Management API
    const mgmtClient = new ManagementClient({
      domain: process.env.AUTH0_API_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    });

    const latestUserInfo = await (await mgmtClient.users.get({ id: session.user.sub })).data

    console.log('Latest user info:', latestUserInfo)
    
    // Ensure 'sub' matches - important safety check
    if(latestUserInfo.user_id !== session.user.sub) {
        console.error('User info sub mismatch during session update. Aborting.')
        throw new Error('User identity mismatch during session update.')
    }

    // 4. Create the new session data
    // It's generally safest to create a new user object rather than merging potentially undefined fields
    const newUserProfile = { ...latestUserInfo };

    // Create the new session structure, preserving existing top-level session data
    // but replacing the user object entirely with the fresh profile.
    const newSession: SessionData = {
        ...session, // Preserve existing session data like tokens, expiry times etc.
        user: newUserProfile, // Replace user object with the fresh one
    };

    // 5. Update the session cookie
    // updateSession() writes cookies to the response implicitly
    await auth0.updateSession(newSession);
    console.log('newSession', newSession)

    console.log('User session updated successfully for sub:', newSession.user.sub);
    // Return only necessary/safe user info back to client if needed
    const { sub, name, email, picture } = newSession.user;
    const response = NextResponse.json({ 
      message: 'Session updated successfully', 
      sub: newSession.user.sub,
      session: await auth0.getSession()
    })

    return response;

  } catch (error: unknown) {
    let errorMessage = 'Failed to update session';
    let statusCode = 500;

    if (error instanceof Error) {
        errorMessage = error.message;
        // Potentially check for specific error types/codes if needed
    }
     console.error('Error updating session:', error);

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// Optional: Add a GET handler if needed, otherwise POST is sufficient for this action
// export async function GET(request: NextRequest) { ... }