import { useCallback, useEffect, useRef } from "react";

type SynthNote = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

type UseSynthSoundEffectsOptions = {
  volume?: number;
};

export function useSynthSoundEffects({
  volume = 0.25,
}: UseSynthSoundEffectsOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }, []);

  const playNote = useCallback(
    async (note: SynthNote): Promise<void> => {
      const audioContext = getAudioContext();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = note.type ?? "sine";
      oscillator.frequency.setValueAtTime(note.frequency, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        (note.gain ?? 1) * volume,
        now + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + note.duration + 0.02);
    },
    [getAudioContext, volume],
  );

  const playGood = useCallback((): Promise<void> => {
    return playNote({
      frequency: 880,
      duration: 0.12,
      type: "sine",
    });
  }, [playNote]);

  const playBad = useCallback((): Promise<void> => {
    return playNote({
      frequency: 220,
      duration: 0.18,
      type: "square",
      gain: 0.8,
    });
  }, [playNote]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  return {
    playGood,
    playBad,
  };
}
