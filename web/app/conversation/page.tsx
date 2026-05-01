"use client";

import { useRef, useState } from "react";

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

type Side = "A" | "B";

type Message = {
  side: Side;
  from: string;
  to: string;
  original: string;
  translated: string;
};

export default function ConversationPage() {
  const [languageA, setLanguageA] = useState("en");
  const [languageB, setLanguageB] = useState("fr");
  const [activeSide, setActiveSide] = useState<Side>("A");
  const [listening, setListening] = useState(false);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [status, setStatus] = useState("Ready");
  const [messages, setMessages] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);

  async function translateAndSpeak(text: string, side: Side) {
    const from = side === "A" ? languageA : languageB;
    const to = side === "A" ? languageB : languageA;

    setStatus("Translating...");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          source: from,
          target: to,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatus("Translation failed");
        return;
      }

      const translated = data.translatedText || data.translation || "";

      setMessages((current) => [
        {
          side,
          from,
          to,
          original: text,
          translated,
        },
        ...current,
      ]);

      speak(translated, to);
      setStatus(data.demo ? "Demo translation" : "Translated");

      if (autoSwitch) {
        const nextSide = side === "A" ? "B" : "A";
        setActiveSide(nextSide);

        setTimeout(() => {
          startListening(nextSide);
        }, 1200);
      }
    } catch {
      setStatus("Error");
    }
  }

  function startListening(side: Side = activeSide) {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    stopListening();

    const from = side === "A" ? languageA : languageB;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = from;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setActiveSide(side);
      setStatus(`Listening to Person ${side}...`);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      setStatus(`Mic error: ${event.error || "unknown"}`);
    };

    recognition.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript;
      translateAndSpeak(spoken, side);
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

  function speak(text: string, lang: string) {
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function clearConversation() {
    stopListening();
    window.speechSynthesis.cancel();
    setMessages([]);
    setStatus("Conversation cleared");
    setActiveSide("A");
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-3 text-center">
          <a href="/" className="text-sm text-blue-400">
            ← Back to translator
          </a>

          <h1 className="text-4xl font-bold">Conversation Mode</h1>

          <p className="text-gray-400">
            Speak, translate, reply. Auto-switch keeps the conversation moving.
          </p>

          <p className="text-sm text-blue-400">{status}</p>
        </header>

        <section className="rounded-3xl bg-zinc-900 p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-gray-400">Person A language</span>
              <select
                value={languageA}
                onChange={(e) => setLanguageA(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-gray-400">Person B language</span>
              <select
                value={languageB}
                onChange={(e) => setLanguageB(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-zinc-800 p-4">
            <span>
              <span className="block font-semibold">Auto-switch speakers</span>
              <span className="text-sm text-gray-400">
                After Person A speaks, the app listens for Person B next.
              </span>
            </span>

            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={(e) => setAutoSwitch(e.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <div className="rounded-2xl bg-zinc-800 p-4 text-center">
            <p className="text-sm text-gray-400">Next speaker</p>
            <p className="text-2xl font-bold">Person {activeSide}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => startListening("A")}
              className={`rounded-3xl px-6 py-10 text-2xl font-bold ${
                activeSide === "A"
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              {listening && activeSide === "A"
                ? "Listening..."
                : "Person A speaks"}
            </button>

            <button
              onClick={() => startListening("B")}
              className={`rounded-3xl px-6 py-10 text-2xl font-bold ${
                activeSide === "B"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              {listening && activeSide === "B"
                ? "Listening..."
                : "Person B speaks"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => startListening(activeSide)}
              disabled={listening}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              Start Next Speaker
            </button>

            <button
              onClick={stopListening}
              className="rounded-2xl bg-red-600 px-6 py-3 font-semibold hover:bg-red-500"
            >
              Stop Listening
            </button>
          </div>

          <button
            onClick={clearConversation}
            className="w-full rounded-2xl bg-zinc-800 px-6 py-3 font-semibold hover:bg-zinc-700"
          >
            Clear Conversation
          </button>
        </section>

        <section className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">
              Conversation history will appear here.
            </p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="rounded-2xl bg-zinc-900 p-4">
                <p className="text-sm text-gray-400">
                  Person {message.side}: {message.from} → {message.to}
                </p>
                <p className="mt-2">{message.original}</p>
                <p className="mt-2 text-xl font-semibold">
                  {message.translated}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
