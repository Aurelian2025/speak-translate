export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://libretranslate.de/translate", {
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
  } catch {
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}
