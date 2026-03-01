/**
 * Server-side word validator.
 * Uses 'an-array-of-english-words' for a ~275k word dictionary.
 * The Set provides O(1) lookups preventing client-side cheating.
 */

let wordSet;

try {
  const words = require('an-array-of-english-words');
  wordSet = new Set(words.map((w) => w.toUpperCase()));
  console.log(`[Dict] Loaded ${wordSet.size} words.`);
} catch {
  // Fallback minimal set if package missing
  const fallback = [
    'CAT','DOG','RUN','SIT','THE','AND','FOR','ARE','BUT','NOT','YOU',
    'ALL','CAN','HER','WAS','ONE','OUR','OUT','DAY','GOT','HOW','MAN',
    'NEW','NOW','OLD','SEE','TWO','WAY','WHO','BOY','DID','ITS','LET',
    'PUT','SAY','SHE','TOO','USE','WORD','HAVE','FROM','THEY','KNOW',
    'WANT','BEEN','GOOD','MUCH','SOME','TIME','VERY','WHEN','COME',
    'EACH','GIVE','MOST','TELL','GAME','GRID','PLAY','WORD','LETTER',
  ];
  wordSet = new Set(fallback);
  console.warn('[Dict] Fallback dictionary active. Run: npm install an-array-of-english-words');
}

/**
 * Validates a word against the server dictionary.
 * Minimum length: 3 characters.
 * @param {string} word
 * @returns {boolean}
 */
function validateWord(word) {
  if (!word || word.length < 3) return false;
  return wordSet.has(word.toUpperCase());
}

module.exports = { validateWord };
