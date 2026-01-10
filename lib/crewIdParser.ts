/**
 * Parses crewId to extract division code and numeric crew ID
 * 
 * Examples:
 * - "MAS1456" → { divisionCode: "MAS", crewId: "1456" }
 * - "MS3034" → { divisionCode: "MS", crewId: "3034" }
 * - "TBM1844" → { divisionCode: "TBM", crewId: "1844" }
 * 
 * @param fullCrewId - The full crew ID (e.g., "MAS1456")
 * @returns Object with divisionCode and crewId, or null if parsing fails
 */
export function parseCrewId(fullCrewId: string): { divisionCode: string; crewId: string } | null {
  if (!fullCrewId || typeof fullCrewId !== 'string') {
    return null
  }

  const trimmed = fullCrewId.trim().toUpperCase()

  // Common division codes (2-4 characters)
  // These are known railway station codes in Southern Railway
  const divisionCodes = [
    'MAS', 'MS', 'TBM', 'MDU', 'TEN', 'DG', 'SA', 'ED', 'CBE',
    'TPJ', 'TJ', 'KMU', 'PGT', 'SRR', 'OTP', 'TVC', 'QLN', 'ALLP',
    'AVD', 'AJJ', 'KPD'
  ]

  // Try to match known division codes (longest first for accuracy)
  // Sort by length descending to match longer codes first (e.g., "MAS" before "MS")
  const sortedCodes = divisionCodes.sort((a, b) => b.length - a.length)

  for (const code of sortedCodes) {
    if (trimmed.startsWith(code)) {
      const remaining = trimmed.substring(code.length)
      // Check if remaining part is numeric (the crew ID)
      if (remaining.length > 0 && /^\d+$/.test(remaining)) {
        return {
          divisionCode: code,
          crewId: remaining,
        }
      }
    }
  }

  // Fallback: Try to extract division code (2-4 uppercase letters) followed by numbers
  const match = trimmed.match(/^([A-Z]{2,4})(\d+)$/)
  if (match) {
    return {
      divisionCode: match[1],
      crewId: match[2],
    }
  }

  // If no pattern matches, treat entire string as crewId with default division
  // This handles edge cases but should be logged
  console.warn(`Could not parse division from crewId: ${fullCrewId}, using as-is`)
  return {
    divisionCode: 'UNKNOWN',
    crewId: trimmed,
  }
}

/**
 * Validates if a division code is known/valid
 */
export function isValidDivisionCode(code: string): boolean {
  const validCodes = [
    'MAS', 'MS', 'TBM', 'MDU', 'TEN', 'DG', 'SA', 'ED', 'CBE',
    'TPJ', 'TJ', 'KMU', 'PGT', 'SRR', 'OTP', 'TVC', 'QLN', 'ALLP',
    'AVD', 'AJJ', 'KPD', 'UNKNOWN'
  ]
  return validCodes.includes(code.toUpperCase())
}

