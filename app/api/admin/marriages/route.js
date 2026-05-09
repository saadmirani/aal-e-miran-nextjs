import { supabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

/**
 * POST /api/admin/marriages
 * Create a marriage relationship
 */
export async function POST(request) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const data = await request.json();

      if (!data.spouse1Id || !data.spouse2Id) {
         return Response.json(
            { error: 'Both spouse IDs are required' },
            { status: 400 }
         );
      }

      // Check if marriage already exists
      const { data: existing } = await supabaseAdmin
         .from('marriages')
         .select('id')
         .or(
            `and(spouse1_id.eq.${data.spouse1Id},spouse2_id.eq.${data.spouse2Id}),` +
            `and(spouse1_id.eq.${data.spouse2Id},spouse2_id.eq.${data.spouse1Id})`
         );

      if (existing && existing.length > 0) {
         return Response.json(
            { error: 'Marriage already exists between these two persons' },
            { status: 400 }
         );
      }

      const { data: marriage, error } = await supabaseAdmin
         .from('marriages')
         .insert([{
            spouse1_id: data.spouse1Id,
            spouse2_id: data.spouse2Id,
            marriage_date: data.marriage_date || null,
            is_active: true
         }])
         .select()
         .single();

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to create marriage' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Marriage created successfully',
         data: marriage
      });

   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}

/**
 * DELETE /api/admin/marriages/:marriageId
 */
export async function DELETE(request, { params }) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const { marriageId } = params;

      const { error } = await supabaseAdmin
         .from('marriages')
         .delete()
         .eq('id', marriageId);

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to delete marriage' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Marriage deleted successfully'
      });

   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}
