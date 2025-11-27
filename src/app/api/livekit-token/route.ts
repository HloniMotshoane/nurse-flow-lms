import { type NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export const revalidate = 0

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room")
  const username = req.nextUrl.searchParams.get("username")
  const isHost = req.nextUrl.searchParams.get("isHost") === "true"

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 })
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured - LiveKit credentials missing" }, { status: 500 })
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: username })

  // Grant permissions
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Give host additional permissions
    ...(isHost && {
      roomRecord: true,
      roomAdmin: true,
    }),
  })

  return NextResponse.json({ token: await at.toJwt() }, { headers: { "Cache-Control": "no-store" } })
}
