interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; onresult: ((event: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; start(): void; stop(): void; }
interface SpeechRecognitionEvent { results: SpeechRecognitionResultList; }
interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; }
