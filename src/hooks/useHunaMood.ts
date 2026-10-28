import { useEffect, useState } from 'react';

/** Huna the cat lives in the GitHub profile repo; visitors feed/play/pet her through issues. */
const STATE_URL = 'https://raw.githubusercontent.com/Zidarc/Zidarc/main/cat/state.json';

export interface HunaMood {
  /** 0–100 */
  fullness: number;
  /** 0–100 */
  happiness: number;
}

/** Huna's live mood, or null while loading / if GitHub can't be reached. */
export function useHunaMood(): HunaMood | null {
  const [mood, setMood] = useState<HunaMood | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(STATE_URL, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<HunaMood> | null) => {
        if (typeof data?.fullness === 'number' && typeof data.happiness === 'number') {
          setMood({ fullness: data.fullness, happiness: data.happiness });
        }
      })
      .catch(() => {}); // offline or blocked: the note just keeps its default wording
    return () => controller.abort();
  }, []);

  return mood;
}

/** What the note under the hero says about her right now. */
export function hunaLine(mood: HunaMood | null): string {
  if (!mood) return "She's hungry! Go feed her on my GitHub 🐟";
  if (mood.fullness < 40) return `She's only ${mood.fullness}% full! Go feed her on my GitHub 🐟`;
  if (mood.happiness < 50) return "She's bored. Go play with her on my GitHub 🧶";
  return `She's ${mood.fullness}% full and happy right now. Go say hi on my GitHub 🐾`;
}
