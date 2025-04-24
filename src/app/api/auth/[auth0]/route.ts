import { auth } from '@auth0/nextjs-auth0';

export const GET = auth.handleAuth((req) => {
    const { searchParams } = new URL(req.url);
    const screen_hint = searchParams.get('screen_hint') || undefined;
    const connection = searchParams.get('connection') || undefined;
    const login_hint = searchParams.get('login_hint') || undefined;
    const returnTo = searchParams.get('returnTo') || '/';

    console.log('screen_hint', screen_hint);
    console.log('connection', connection);
    console.log('login_hint', login_hint);
    console.log('return_to', returnTo);

    return {
      authorizationParams: {
        screen_hint: screen_hint,
        connection: connection,
        login_hint: login_hint
      },
      returnTo: returnTo
    };
  })
});
