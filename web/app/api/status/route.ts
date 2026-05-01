export async function GET() {
  return Response.json({
    translationBackendConnected: Boolean(process.env.LIBRETRANSLATE_URL),
    mode: process.env.LIBRETRANSLATE_URL ? "live" : "demo",
  });
}
