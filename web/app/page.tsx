"use client";

import { useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "fa", name: "Farsi / Persian" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
];

export default function Home() {
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("fr");
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  async function translate(input: string) {
  if (!input.trim()) {
    setTranslated("No text to translate.");
    return;
  }

  setLoading(true);
  setTranslated("Translating...");

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input,
        source,
        target,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setTranslated(`API error: ${JSON.stringify(data)}`);
      return;
    }

    if (data.error) {
      setTranslated(`Error: ${JSON.stringify(data)}`);
      return;
    }

    const result = data.translatedText || data.translation || "";

    if (!result) {
      setTranslated(`No translation returned: ${JSON.stringify(data)}`);
      return;
    }

    setTranslated(result);
    speak(result);
  } catch (error) {
    setTranslated(`Frontend error: ${String(error)}`);
  } finally {
    setLoading(false);
  }
}

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = source;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript;
      setText(spoken);
      translate(spoken);
    };

    recognition.start();
  }

  function speak(input: string) {
    if (!input.trim()) return;

    const utterance = new SpeechSynthesisUtterance(input);
    utterance.lang = target;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function swapLanguages() {
    setSource(target);
    setTarget(source);
    setText("");
    setTranslated("");
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Speak → Translate → Speak</h1>
          <p className="text-gray-400">
            Speak in one language and hear the translation aloud.
          </p>
        </header>

        <section className="rounded-3xl bg-zinc-900 p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="space-y-2">
              <span className="text-sm text-gray-400">From</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={swapLanguages}
              className="rounded-xl bg-zinc-800 px-4 py-3 font-semibold hover:bg-zinc-700"
            >
              Swap
            </button>

            <label className="space-y-2">
              <span className="text-sm text-gray-400">To</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={startListening}
            disabled={listening || loading}
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {listening ? "Listening..." : loading ? "Translating..." : "Tap to Speak"}
          </button>

          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-800 p-4">
              <p className="mb-2 text-sm text-gray-400">You said:</p>
              <p className="min-h-6 text-lg">{text || "Nothing yet"}</p>
            </div>

            <div className="rounded-2xl bg-zinc-800 p-4">
              <p className="mb-2 text-sm text-gray-400">Translation:</p>
              <p className="min-h-6 text-lg">
                {translated || "Translation will appear here"}
              </p>
            </div>
          </div>

          <button
            onClick={() => speak(translated)}
            disabled={!translated}
            className="w-full rounded-2xl bg-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Replay Translation
          </button>
        </section>
      </div>
    </main>
  );
}
