export async function POST(req: Request) {
  try {
    const body = await req.json();

    const source = body.source === "auto" ? "auto" : body.source;

    if (!process.env.LIBRETRANSLATE_URL) {
      return Response.json({
        translatedText: `[Demo ${source} → ${body.target}] ${body.text}`,
        demo: true,
      });
    }

    const response = await fetch(`${process.env.LIBRETRANSLATE_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.LIBRETRANSLATE_API_KEY
          ? { Authorization: `Bearer ${process.env.LIBRETRANSLATE_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        q: body.text,
        source,
        target: body.target,
        format: "text",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error || "Translation failed", details: data },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Proxy failed", details: String(error) },
      { status: 500 }
    );
  }
}
