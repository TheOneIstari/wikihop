export type Challenge = { id: string; title: string; kicker: string; description: string; start: string; target: string; tone: 'blue' | 'orange' | 'ink' }

export const challenges: Challenge[] = [
  { id: 'cartoons-science', title: 'Cartoons to Science', kicker: 'Springfield theorem', description: 'Escape Springfield and bend pop culture toward the strange laws of the universe.', start: 'Homer Simpson', target: 'Quantum mechanics', tone: 'blue' },
  { id: 'tropical-ancient', title: 'Tropical to Ancient', kicker: 'A fruit out of time', description: 'Trade bright tropical fields for marble roads, emperors and an ancient superpower.', start: 'Pineapple', target: 'Roman Empire', tone: 'orange' },
  { id: 'ocean-architecture', title: 'Ocean to Architecture', kicker: 'Eight arms, four legs', description: 'Leave the deep sea behind and surface beneath the iron lattice of Paris.', start: 'Octopus', target: 'Eiffel Tower', tone: 'ink' },
]
