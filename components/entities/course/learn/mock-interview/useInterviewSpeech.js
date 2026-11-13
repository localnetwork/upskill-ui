import { useCallback, useEffect, useRef, useState } from "react";

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /en-(US|GB)/i.test(voice.lang) && /natural|google|samantha|daniel|aria|jenny/i.test(voice.name)) ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    null
  );
}

export default function useInterviewSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState({ tts: false, stt: false });
  const recognitionRef = useRef(null);
  const finalRef = useRef("");

  useEffect(() => {
    setSupported({
      tts: "speechSynthesis" in window,
      stt: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    });
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const speak = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!("speechSynthesis" in window) || !text) return resolve();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.onstart = () => setSpeaking(true);
        const done = () => {
          setSpeaking(false);
          resolve();
        };
        utterance.onend = done;
        utterance.onerror = done;
        window.speechSynthesis.speak(utterance);
      }),
    [],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return false;
    recognitionRef.current?.abort();
    finalRef.current = "";
    setTranscript("");

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalRef.current += `${chunk} `;
        else interim += chunk;
      }
      setTranscript(`${finalRef.current}${interim}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    return true;
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return {
    speaking,
    listening,
    transcript,
    setTranscript,
    supported,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
