import { auth0 } from "@/lib/auth0"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const session = await auth0.getSession()
    if (!session) {
        return NextResponse.error()
    }

    return auth0.startInteractiveLogin({
        returnTo: '/auth-complete.html?status=success',
        authorizationParameters: {
            'id_token_hint': session?.tokenSet.idToken,
            requested_connection: request.nextUrl.searchParams.get("requested_connection"),
            scope: process.env.AUTH0_SCOPE + " link_account",
            audience: process.env.AUTH0_AUDIENCE,
        }
    })
}
