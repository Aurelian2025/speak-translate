const supportedLanguages = ["en", "fr", "es", "fa", "zh"];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const source = body.source === "auto" ? "en" : body.source;
    const target = body.target;

    if (!supportedLanguages.includes(source) || !supportedLanguages.includes(target)) {
      return Response.json(
        { error: "Unsupported language for free backend" },
        { status: 400 }
      );
    }

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", body.text);
    url.searchParams.set("langpair", `${source}|${target}`);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.responseStatus !== 200) {
      return Response.json(
        { error: "Translation failed", details: data },
        { status: 500 }
      );
    }

    return Response.json({
      translatedText: data.responseData.translatedText,
      backend: "mymemory",
    });
  } catch (error) {
    return Response.json(
      { error: "Proxy failed", details: String(error) },
      { status: 500 }
    );
  }
}
