"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [listening, setListening] = useState(false);

  async function translate(input: string) {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input,
        source: "en",
        target: "fr",
      }),
    });

    const data = await res.json();
    const result = data.translatedText || data.translation || "";
    setTranslated(result);

    speak(result);
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript;
      setText(spoken);
      translate(spoken);
    };

    recognition.start();
  }

  function speak(text: string) {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr";

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Speak → Translate → Speak</h1>

        <button
          onClick={startListening}
          className="px-6 py-3 bg-blue-600 rounded-xl"
        >
          {listening ? "Listening..." : "Tap to Speak"}
        </button>

        <div>
          <p className="text-gray-400">You said:</p>
          <p>{text}</p>
        </div>

        <div>
          <p className="text-gray-400">Translation:</p>
          <p>{translated}</p>
        </div>
      </div>
    </main>
  );
}