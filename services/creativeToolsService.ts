// Creative writing tools service
// Each function takes input(s) and returns an array of strings (suggestions/results)

export function generateSimile(input: string): string[] {
  // Example similes for demonstration
  if (!input) return [];
  return [
    `as chaotic as a kicked anthill`,
    `like a circuit board with a million flashing lights`,
    `as busy as a beehive` // Placeholder examples
  ];
}

export function explodeWord(input: string): string[] {
  // Example exploded words for demonstration
  if (!input) return [];
  return [
    `dead eight`,
    `did I cite`,
    `dedicate` // Placeholder examples
  ];
}

export function unexpect(input: string): string[] {
  if (!input) return [];
  return [
    `a walk in the park where the pigeons are robotic and whisper secrets`,
    `a walk in the park with upside-down trees`,
    `a walk in the park during a rain of jellybeans`
  ];
}

export function chainWords(input: string): string[] {
  if (!input) return [];
  return [
    `mountain -> peak -> snow -> cold -> winter -> fireplace -> warmth`
  ];
}

export function pov(input: string): string[] {
  if (!input) return [];
  return [
    `a psychologist's concern`,
    `a marketer's opportunity`,
    `a teenager's social lifeline`
  ];
}

export function alliteration(topic: string, letter: string): string[] {
  if (!topic || !letter) return [];
  return [
    `deep`,
    `dark`,
    `damp`,
    `drowning`
  ];
}

export function acronym(input: string): string[] {
  if (!input) return [];
  return [
    `Determinedly Reaching for Extraordinary Aspirations and Meaning`
  ];
}

export function fuse(concept1: string, concept2: string): string[] {
  if (!concept1 || !concept2) return [];
  return [
    `a car with a wooden chassis`,
    `the rust on a car spreading like rings on a tree trunk`
  ];
}

export function scene(input: string): string[] {
  if (!input) return [];
  return [
    `the scent of old paper and dust`,
    `the soft rustle of turning pages`,
    `the gentle hum of fluorescent lights`
  ];
}

export function unfold(input: string): string[] {
  if (!input) return [];
  return [
    `a heart on fire`,
    `firing up the engine`
  ];
}
