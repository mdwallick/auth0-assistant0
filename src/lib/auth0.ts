import { NextResponse } from 'next/server'
import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { ServiceManager } from './service-manager';

export const auth0 = new Auth0Client({
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    //backToApp: "/",
  },
  async onCallback(error, context, session) {
    // redirect the user to a custom error page
    if (error) {
      return NextResponse.redirect(
        new URL(`/error?error=${error.message}`, process.env.APP_BASE_URL)
      )
    }

    // complete the redirect to the provided returnTo URL
    return NextResponse.redirect(
      new URL(context.returnTo || "/", process.env.APP_BASE_URL)
    )
  },
  // authorizationParameters: {
  //   access_type: 'offline',
  //   prompt: 'consent',
  // },
});

// Initialize the service manager with auth0 client
export const serviceManager = ServiceManager.initialize(auth0);

// Helper functions for getting access tokens
export const getGoogleAccessToken = () => serviceManager.getAccessToken('google');
export const getMicrosoftAccessToken = () => serviceManager.getAccessToken('microsoft');
export const getSalesforceAccessToken = () => serviceManager.getAccessToken('salesforce');