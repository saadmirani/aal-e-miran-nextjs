/**
 * Content Loader Utility
 * Loads markdown files from the content directory
 * This centralizes content management separate from UI logic
 */

const contents = {
   biography: {
      'rahman-bakhsh-qadri': {
         en: require('@/content/biographies/rahman-bakhsh-qadri/index-en.md').default,
         ur: require('@/content/biographies/rahman-bakhsh-qadri/index-ur.md').default,
      },
   },
   book: {
      'kitab-ul-ansab': {
         en: require('@/content/books/kitab-ul-ansab/index-en.md').default,
         ur: require('@/content/books/kitab-ul-ansab/index-ur.md').default,
      },
   },
};

/**
 * Get biography content by slug and language
 * @param {string} slug - Biography slug
 * @param {string} language - Language code ('en' or 'ur')
 * @returns {string} Markdown content
 */
export function getBiographyContent(slug, language) {
   return contents.biography[slug]?.[language] || null;
}

/**
 * Get book content by slug and language
 * @param {string} slug - Book slug
 * @param {string} language - Language code ('en' or 'ur')
 * @returns {string} Markdown content
 */
export function getBookContent(slug, language) {
   return contents.book[slug]?.[language] || null;
}

/**
 * Get available biography slugs
 * @returns {string[]} Array of biography slugs
 */
export function getAvailableBiographies() {
   return Object.keys(contents.biography);
}

/**
 * Get available book slugs
 * @returns {string[]} Array of book slugs
 */
export function getAvailableBooks() {
   return Object.keys(contents.book);
}
