// Tree cache is intentionally disabled to avoid stale genealogy payloads
// during frequent admin edits.

export async function getFamilyTreeCached(_key, loader) {
   if (typeof loader !== 'function') return null;
   return await loader();
}

export function bustFamilyTreeCache() {
   // no-op by design
}
