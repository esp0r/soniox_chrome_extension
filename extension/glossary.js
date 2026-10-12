// Shared by the popup and offscreen document. TSV: source<TAB>translation.
globalThis.SonioxGlossary = {
  parse(text, targetLanguage) {
    const terms = new Map();
    for (const [index, raw] of String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
      if (!raw.trim()) continue;
      const fields = raw.split('\t').map(value => value.trim());
      if (fields.length > 2 || !fields[0]) throw new Error(`Glossary line ${index + 1}: use a term, optionally followed by a tab and translation.`);
      const [source, target = ''] = fields;
      if (terms.has(source) && terms.get(source) !== target) throw new Error(`Glossary line ${index + 1}: conflicting translations for ${source}.`);
      terms.set(source, target);
    }
    if (terms.size > 200) throw new Error('Use at most 200 glossary entries.');
    if (!terms.size) return undefined;
    const context = { terms: [...terms.keys()] };
    const translations = [...terms].filter(([, target]) => target).map(([source, target]) => ({ source, target }));
    if (translations.length && targetLanguage) context.translation_terms = translations;
    // Conservative byte budget below the API's 8,000-token context limit.
    if (new TextEncoder().encode(JSON.stringify(context)).length > 7500) throw new Error('Glossary is too large. Shorten it or split it into smaller lists.');
    return context;
  },
  context(config) {
    if (!config.glossaryEnabled) return undefined;
    return this.parse(config.glossaryText, config.glossaryTargetLang === config.targetLang);
  }
};
