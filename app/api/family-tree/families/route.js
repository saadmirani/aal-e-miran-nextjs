import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
   try {
      const supabase = getSupabaseAdmin();
      const { data: families, error } = await supabase
         .from('families')
         .select('*')
         .order('name', { ascending: true });

      if (error) throw error;

      return Response.json(
         {
            success: true,
            data: families.map(f => ({
               id: f.id,
               name: f.name,
               qasba: f.qasba,
               description: f.description,
               region: f.region,
               focusPerson: null,
               lastModified: f.updated_at
            }))
         },
         {
            headers: {
               'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
               'Pragma': 'no-cache',
               'Expires': '0'
            }
         }
      );
   } catch (error) {
      return Response.json(
         { error: error.message },
         {
            status: 500,
            headers: {
               'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
               'Pragma': 'no-cache',
               'Expires': '0'
            }
         }
      );
   }
}
