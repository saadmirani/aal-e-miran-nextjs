export async function POST(req) {
   try {
      const { text, sourceLang = 'ur', targetLang = 'en' } = await req.json();

      if (!text || !text.trim()) {
         return new Response(
            JSON.stringify({ error: 'Text is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Use MyMemory Translation API (free, no auth needed)
      const response = await fetch(
         `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${sourceLang}|${targetLang}`
      );

      if (!response.ok) {
         throw new Error('Translation service unavailable');
      }

      const data = await response.json();

      if (data.responseStatus === 200) {
         return new Response(
            JSON.stringify({
               translatedText: data.responseData.translatedText,
               success: true,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
         );
      } else {
         throw new Error('Translation failed');
      }
   } catch (error) {
      console.error('Translation error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Translation failed' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
