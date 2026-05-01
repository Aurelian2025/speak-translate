export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.LIBRETRANSLATE_URL) {
      return Response.json({
        translatedText: `[Demo translation: ${body.target}] ${body.text}`,
        demo: true,
      });
    }

    const response = await fetch("https://translate.astian.org/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: body.text,
        source: body.source,
        target: body.target,
        format: "text",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error || "Translation failed" },
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
