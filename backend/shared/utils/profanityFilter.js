/**
 * Profanity Filter Utility
 * Auto-censors inappropriate language in user content
 */

// Basic list of common profanity (add more as needed)
const profanityList = [
  // English profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
  'shit', 'shitting', 'shitty', 'bullshit',
  'ass', 'asshole', 'asses',
  'bitch', 'bitches', 'bitching',
  'damn', 'damned', 'dammit',
  'crap', 'crappy',
  'dick', 'dicks', 'dickhead',
  'cock', 'cocks',
  'pussy', 'pussies',
  'cunt', 'cunts',
  'bastard', 'bastards',
  'whore', 'whores',
  'slut', 'sluts',
  'piss', 'pissed', 'pissing',
  'wanker', 'wankers',
  'twat', 'twats',
  'arse', 'arsehole',
  'bollocks',
  'bugger',
  'bloody',
  'motherfucker', 'motherfucking',
  'nigger', 'nigga', 'niggas',
  'faggot', 'faggots', 'fag', 'fags',
  'retard', 'retarded', 'retards',
  // Common leetspeak variations
  'f4ck', 'fuk', 'fck', 'phuck',
  'sh1t', 'sht',
  'b1tch', 'btch',
  'd1ck', 'dck',
  // Add more as needed
];

// Words that should NOT be censored even if they contain profanity substrings
const whitelist = [
  'assign', 'assigned', 'assignment', 'assignments',
  'assist', 'assistant', 'assistance',
  'assume', 'assumed', 'assuming', 'assumption',
  'assemble', 'assembled', 'assembly',
  'assess', 'assessed', 'assessment', 'assessor',
  'asset', 'assets',
  'associate', 'associated', 'association',
  'ассоrт', 'assort', 'assorted', 'assortment',
  'class', 'classes', 'classic', 'classical', 'classify',
  'bass', 'basses',
  'mass', 'masses', 'massive',
  'pass', 'passed', 'passing', 'passage', 'passenger',
  'grass', 'grassy',
  'brass',
  'glass', 'glasses',
  'compass',
  'bypass',
  'embarrass', 'embarrassed', 'embarrassing',
  'harass', 'harassed', 'harassment',
  'cocktail', 'cocktails',
  'peacock',
  'hancock',
  'cockatoo',
  'scunthorpe', // Famous example
  'penistone',
  'arsenal',
  'therapist',
  'analyze', 'analysis',
  'button', 'buttons',
  'butter',
  'butterfly',
  'shutter', 'shutters',
  'shuttle',
  'scrap', 'scrappy',
  'strap', 'strappy',
  'wrap', 'wrapper',
  'trap', 'trapped',
  'grape', 'grapes',
  'drape', 'drapes',
  'escape', 'escaped',
  'landscape',
  'scrape', 'scraped',
  'shape', 'shaped',
  'tape', 'taped',
  'cape',
  'gape',
];

/**
 * Check if a word is in the whitelist
 * @param {string} word - Word to check
 * @returns {boolean}
 */
const isWhitelisted = (word) => {
  return whitelist.includes(word.toLowerCase());
};

/**
 * Create a regex pattern for a profanity word
 * Uses word boundaries to avoid false positives
 * @param {string} word - Profanity word
 * @returns {RegExp}
 */
const createPattern = (word) => {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use word boundaries
  return new RegExp(`\\b${escaped}\\b`, 'gi');
};

/**
 * Censor a single word by replacing middle characters with asterisks
 * @param {string} word - Word to censor
 * @returns {string} - Censored word (e.g., "fuck" -> "f**k")
 */
const censorWord = (word) => {
  if (word.length <= 2) {
    return '*'.repeat(word.length);
  }
  const first = word[0];
  const last = word[word.length - 1];
  const middle = '*'.repeat(word.length - 2);
  return `${first}${middle}${last}`;
};

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean}
 */
const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  for (const word of profanityList) {
    const pattern = createPattern(word);
    const matches = lowerText.match(pattern);
    
    if (matches) {
      // Check if any match is not whitelisted
      for (const match of matches) {
        // Get the full word containing the match
        const wordPattern = new RegExp(`\\b\\w*${match}\\w*\\b`, 'gi');
        const fullWords = text.match(wordPattern) || [];
        
        for (const fullWord of fullWords) {
          if (!isWhitelisted(fullWord)) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

/**
 * Censor profanity in text
 * @param {string} text - Text to censor
 * @returns {string} - Censored text
 */
const censorProfanity = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  for (const word of profanityList) {
    const pattern = createPattern(word);
    
    result = result.replace(pattern, (match) => {
      // Get surrounding context to check for whitelisted words
      const index = result.toLowerCase().indexOf(match.toLowerCase());
      if (index === -1) return censorWord(match);
      
      // Extract the full word at this position
      const before = result.substring(0, index);
      const after = result.substring(index + match.length);
      
      // Check if this is part of a larger whitelisted word
      const beforeWord = before.match(/\w+$/) || [''];
      const afterWord = after.match(/^\w+/) || [''];
      const fullWord = beforeWord[0] + match + afterWord[0];
      
      if (isWhitelisted(fullWord)) {
        return match; // Don't censor whitelisted words
      }
      
      return censorWord(match);
    });
  }
  
  return result;
};

/**
 * Sanitize user input by censoring profanity
 * @param {object} data - Object containing text fields to sanitize
 * @param {string[]} fields - Array of field names to check
 * @returns {object} - Sanitized data
 */
const sanitizeInput = (data, fields) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  for (const field of fields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = censorProfanity(sanitized[field]);
    }
  }
  
  return sanitized;
};

module.exports = {
  containsProfanity,
  censorProfanity,
  sanitizeInput,
  profanityList,
  whitelist
};
