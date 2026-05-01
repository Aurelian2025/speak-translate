"use client";

import { useEffect, useRef, useState } from "react";

const languages = [
  { code: "auto", name: "Auto detect" },
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

type HistoryItem = {
  text: string;
  translated: string;
};

export default function Home() {
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("fr");
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [translated, setTranslated] = useState("");
  const [status, setStatus] = useState("Ready");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("translation-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  function saveHistory(input: string, output: string) {
    const newEntry = { text: input, translated: output };
    const updatedHistory = [newEntry, ...history].slice(0, 10);

    setHistory(updatedHistory);
    localStorage.setItem("translation-history", JSON.stringify(updatedHistory));
  }

  async function translate(input: string) {
    if (!input.trim()) {
      setTranslated("Type or speak something first.");
      return;
    }

    setLoading(true);
    setStatus("Translating...");
    setTranslated("");

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

      if (!res.ok || data.error) {
        setTranslated(`Translation error: ${JSON.stringify(data)}`);
        setStatus("Translation failed");
        return;
      }

      const result = data.translatedText || data.translation || "";

      if (!result) {
        setTranslated(`No translation returned: ${JSON.stringify(data)}`);
        setStatus("No result");
        return;
      }

      setTranslated(result);
      saveHistory(input, result);
      setStatus(data.demo ? "Demo translation" : "Translated");
      speak(result);
    } catch (error) {
      setTranslated(`Frontend error: ${String(error)}`);
      setStatus("Error");
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

    stopListening();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = source === "auto" ? "en" : source;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening...");
      setInterimText("");
    };

    recognition.onend = () => {
      setListening(false);
      setStatus("Stopped listening");
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      setStatus(`Mic error: ${event.error || "unknown"}`);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      if (finalTranscript.trim()) {
        const nextText = `${text} ${finalTranscript}`.trim();
        setText(nextText);
        setInterimText("");
        translate(nextText);
      }
    };

    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListening(false);
  }

  function speak(input: string) {
    if (!input.trim()) return;

    const utterance = new SpeechSynthesisUtterance(input);
    utterance.lang = target;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function swapLanguages() {
    if (source === "auto") {
      setSource(target);
      setTarget("en");
    } else {
      setSource(target);
      setTarget(source);
    }

    setText("");
    setInterimText("");
    setTranslated("");
    setStatus("Languages swapped");
  }

  async function copyTranslation() {
    if (!translated) return;

    await navigator.clipboard.writeText(translated);
    setStatus("Translation copied");
  }

  async function shareTranslation() {
    if (!translated) return;

    if (navigator.share) {
      await navigator.share({
        title: "Speak Translate",
        text: translated,
      });
      setStatus("Translation shared");
    } else {
      await navigator.clipboard.writeText(translated);
      setStatus("Sharing not supported. Translation copied instead.");
    }
  }

  function clearAll() {
    stopListening();
    window.speechSynthesis.cancel();
    setText("");
    setInterimText("");
    setTranslated("");
    setStatus("Cleared");
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("translation-history");
    setStatus("History cleared");
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Speak → Translate → Speak</h1>

          <p className="text-gray-400">
            Speak or type. Translate instantly. Hear it aloud.
          </p>

          <a href="/conversation" className="inline-block text-sm text-blue-400">
            Open Conversation Mode →
          </a>

          <p className="text-sm text-blue-400">{status}</p>
        </header>

        <section className="rounded-3xl bg-zinc-900 p-5 space-y-5 shadow-xl">
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
                {languages
                  .filter((language) => language.code !== "auto")
                  .map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl bg-zinc-800 p-4 space-y-3">
            <label className="block text-sm text-gray-400">Input text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type here, or tap the mic and speak..."
              className="min-h-32 w-full resize-none rounded-xl bg-zinc-950 p-4 text-lg text-white outline-none"
            />

            {interimText && (
              <p className="rounded-xl bg-zinc-700 p-3 text-gray-300">
                Hearing: {interimText}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!listening ? (
              <button
                onClick={startListening}
                disabled={loading}
                className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tap to Speak
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="rounded-2xl bg-red-600 px-6 py-4 text-lg font-semibold hover:bg-red-500"
              >
                Stop Listening
              </button>
            )}

            <button
              onClick={() => translate(text)}
              disabled={loading || !text.trim()}
              className="rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Translating..." : "Translate Text"}
            </button>
          </div>

          <div className="rounded-2xl bg-zinc-800 p-4">
            <p className="mb-2 text-sm text-gray-400">Translation</p>
            <p className="min-h-16 whitespace-pre-wrap text-xl">
              {translated || "Translation will appear here"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <button
              onClick={() => speak(translated)}
              disabled={!translated}
              className="rounded-2xl bg-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replay
            </button>

            <button
              onClick={copyTranslation}
              disabled={!translated}
              className="rounded-2xl bg-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy
            </button>

            <button
              onClick={shareTranslation}
              disabled={!translated}
              className="rounded-2xl bg-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Share
            </button>

            <button
              onClick={clearAll}
              className="rounded-2xl bg-zinc-800 px-6 py-3 font-semibold hover:bg-zinc-700"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm text-gray-400">Recent translations</h2>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Clear history
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history yet.</p>
            ) : (
              history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setText(item.text);
                    setTranslated(item.translated);
                    setStatus("Loaded from history");
                  }}
                  className="w-full rounded-xl bg-zinc-800 p-3 text-left hover:bg-zinc-700"
                >
                  <p className="text-sm text-gray-400">{item.text}</p>
                  <p className="font-semibold text-white">{item.translated}</p>
                </button>
              ))
            )}
          </div>

          <p className="text-center text-xs text-gray-500">
            Translation is currently in demo mode until a paid translation
            backend is connected.
          </p>
        </section>
      </div>
    </main>
  );
}
