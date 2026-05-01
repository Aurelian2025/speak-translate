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

type Message = {
  from: string;
  to: string;
  original: string;
  translated: string;
};

export default function ConversationPage() {
  const [languageA, setLanguageA] = useState("en");
  const [languageB, setLanguageB] = useState("fr");
  const [listeningSide, setListeningSide] = useState<"A" | "B" | null>(null);
  const [status, setStatus] = useState("Ready");
  const [messages, setMessages] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);

  async function translateAndSpeak(text: string, from: string, to: string) {
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
          from,
          to,
          original: text,
          translated,
        },
        ...current,
      ]);

      speak(translated, to);
      setStatus(data.demo ? "Demo translation" : "Translated");
    } catch {
      setStatus("Error");
    }
  }

  function startSide(side: "A" | "B") {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    stopListening();

    const from = side === "A" ? languageA : languageB;
    const to = side === "A" ? languageB : languageA;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = from;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListeningSide(side);
      setStatus(`Listening to Person ${side}...`);
    };

    recognition.onend = () => {
      setListeningSide(null);
    };

    recognition.onerror = () => {
      setListeningSide(null);
      setStatus("Microphone error");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      translateAndSpeak(text, from, to);
    };

    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListeningSide(null);
  }

  function speak(text: string, lang: string) {
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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
            Tap the person who is speaking. The app translates out loud.
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => startSide("A")}
              className="rounded-3xl bg-blue-600 px-6 py-10 text-2xl font-bold hover:bg-blue-500"
            >
              {listeningSide === "A" ? "Listening..." : "Person A speaks"}
            </button>

            <button
              onClick={() => startSide("B")}
              className="rounded-3xl bg-emerald-600 px-6 py-10 text-2xl font-bold hover:bg-emerald-500"
            >
              {listeningSide === "B" ? "Listening..." : "Person B speaks"}
            </button>
          </div>

          <button
            onClick={stopListening}
            className="w-full rounded-2xl bg-zinc-800 px-6 py-3 font-semibold hover:bg-zinc-700"
          >
            Stop
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
                  {message.from} → {message.to}
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
