import { NextRequest, NextResponse } from 'next/server';

// URL of the simple HTML page that handles postMessage back to the opener
const POPUP_CALLBACK_PAGE = '/auth-complete.html';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseOrigin = process.env.APP_BASE_URL; // e.g., http://localhost:3000
  let finalRedirectUrl: URL;

  try {
    const params = request.nextUrl.searchParams;
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const code = params.get('code'); // Still useful to check if it's present on success

    // 1. Check for errors returned directly from Auth0
    if (error) {
      console.error(`Error returned from Auth0 during linking callback: ${errorDescription || error}`);
      throw new Error(`${errorDescription || error}`); // Propagate error message
    }

    // 2. --- Verify State (Still CRITICAL for Security) ---
    if (!state) {
        throw new Error('Missing state parameter in callback.');
    }
    // How you verify depends on how state was created in `/api/auth/link`
    // Example: Assuming state was base64 encoded JSON containing a nonce
    let decodedState: { nonce?: string; /* other data */ } = {};
    try {
        decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch(e) {
        throw new Error('Invalid state format.');
    }
    // TODO: Retrieve the expected nonce (e.g., from signed state, cookie, etc.)
    // const expectedNonce = await retrieveExpectedNonce(request); // Needs implementation
    // if (!decodedState.nonce || decodedState.nonce !== expectedNonce) {
    //    throw new Error('State mismatch. Possible CSRF attack.');
    // }
    console.warn('STATE VERIFICATION LOGIC PENDING IMPLEMENTATION.');


    // 3. Check if essential parameters for success are present
    if (!code) {
         // If there's no error, but also no code, something is wrong
         throw new Error('Callback successful but missing authorization code.');
    }

    // 4. If no errors and state is valid (and code exists), assume success *from Auth0's perspective*
    console.log('Auth0 callback received successfully (code/state present, no error param).');
    finalRedirectUrl = new URL(POPUP_CALLBACK_PAGE, baseOrigin);
    finalRedirectUrl.searchParams.set('status', 'success');

  } catch (error: unknown) {
    console.error("Error processing simplified link callback:", error);
    let errorMessage = 'An unknown error occurred during callback processing.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Prepare error redirect URL
    finalRedirectUrl = new URL(POPUP_CALLBACK_PAGE, baseOrigin);
    finalRedirectUrl.searchParams.set('status', 'error');
    finalRedirectUrl.searchParams.set('message', encodeURIComponent(errorMessage));
  }

  // 5. Redirect the popup browser to the final static page
  // This page will handle the postMessage based on the 'status' param
  console.log(`Redirecting popup to: ${finalRedirectUrl.toString()}`);
  return NextResponse.redirect(finalRedirectUrl.toString(), 302);
}
