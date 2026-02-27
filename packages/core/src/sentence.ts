export function countSentences(text: string): number {
  if (!text.trim()) return 0
  // Strip out common abbreviations and single-letter abbreviations (like initials or D.C.) so their periods don't get counted
  let cleaned = text.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g|a\.m|p\.m|d\.c|u\.s)\./gi, '')
  cleaned = cleaned.replace(/\b[A-Za-z]\./g, '')
  // Match one or more punctuation marks, optional closing quote, followed by space or end of string
  const terminators = cleaned.match(/[.!?]+(?:["']*(?:\s+|$))/g)
  return terminators ? terminators.length : 0
}

export function getSentenceNudge(text: string): string | null {
  const count = countSentences(text)
  if (count <= 2) return null
  if (count === 3) return "That's three sentences — can you trim one?"
  return "Getting long. The magic is in the constraint."
}
