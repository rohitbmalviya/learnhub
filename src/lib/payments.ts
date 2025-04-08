// ============================================================
// LearnHub — Payment utilities
//
// Money is stored as Int in paise (1 INR = 100 paise).
// 0 paise = free course.
// ============================================================

/**
 * Formats paise as a human-readable rupee string.
 * e.g. 149900 → "₹1,499"
 *      0      → "Free"
 */
export function formatPaise(paise: number): string {
  if (paise === 0) return 'Free'
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
}
