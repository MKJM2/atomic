export function countSentences(text: string): number {
  const terminators = text.match(/[.!?]+(\s|$)/g)
  return terminators ? terminators.length : 0
}

export function getSentenceNudge(text: string): string | null {
  const count = countSentences(text)
  if (count <= 2) return null
  if (count === 3) return "That's three sentences — can you trim one?"
  return "Getting long. The magic is in the constraint."
}
