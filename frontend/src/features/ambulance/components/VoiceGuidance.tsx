import { useEffect, useRef, useState } from 'react';

interface VoiceGuidanceProps {
  message: string;
  messageKey: string;
}

function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function VoiceGuidance({ message, messageKey }: VoiceGuidanceProps) {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState('Voice is off. Turn it on to hear guidance when the next route segment changes.');
  const lastSpokenKey = useRef('');
  const supported = speechAvailable();

  useEffect(() => {
    if (!enabled || !supported || !message || lastSpokenKey.current === messageKey) return;
    lastSpokenKey.current = messageKey;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setNotice('Voice guidance played for the current route instruction.');
  }, [enabled, message, messageKey, supported]);

  function speakTest() {
    if (!supported) {
      setNotice('Speech synthesis is unavailable here. Follow the written guidance on screen.');
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    setNotice('Test voice played. This browser feature is not connected to emergency systems.');
  }

  function toggleVoice() {
    if (!supported) {
      setNotice('Speech synthesis is unavailable here. Written guidance remains available.');
      return;
    }
    const nextValue = !enabled;
    setEnabled(nextValue);
    if (!nextValue) window.speechSynthesis.cancel();
    setNotice(nextValue ? 'Voice guidance enabled for new route instructions.' : 'Voice guidance off. Written guidance remains available.');
  }

  return <section className="panel voice-guidance" aria-labelledby="voice-guidance-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Driver assist</span><h2 id="voice-guidance-title">Voice guidance</h2></div><span className={`voice-support ${supported ? 'available' : 'unavailable'}`}>{supported ? 'Browser voice' : 'Text only'}</span></div>
    <p className="panel-description">Optional browser speech for the next demo instruction. No emergency system is connected.</p>
    <div className="voice-actions">
      <button className={`button ${enabled ? 'button-muted' : 'button-primary'}`} type="button" onClick={toggleVoice} aria-pressed={enabled} aria-label={enabled ? 'Turn voice guidance off' : 'Turn voice guidance on'}>{enabled ? 'Voice on' : 'Turn voice on'}</button>
      <button className="button button-secondary" type="button" onClick={speakTest}>Test voice</button>
    </div>
    <p className="voice-notice" role="status" aria-live="polite">{notice}</p>
  </section>;
}
