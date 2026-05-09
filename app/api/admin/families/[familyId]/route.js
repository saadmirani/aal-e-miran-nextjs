import { supabaseAdmin } from '@/lib/supabaseClient';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/families/:familyId
 * Update a family
 */
export async function PUT(request, { params }) {
   try {
      const { familyId } = params;
      const data = await request.json();

      const { data: updatedFamily, error } = await supabaseAdmin
         .from('families')
         .update({
            name: data.name || undefined,
            description: data.description || null,
            region: data.region || null,
            focus_person_id: data.focus_person_id || undefined,
            updated_at: new Date().toISOString()
         })
         .eq('id', familyId)
         .select()
         .single();

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to update family' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Family updated successfully',
         data: updatedFamily
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
 * DELETE /api/admin/families/:familyId
 * Delete a family
 */
export async function DELETE(request, { params }) {
   try {
      const { familyId } = params;

      const { error } = await supabaseAdmin
         .from('families')
         .delete()
         .eq('id', familyId);

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to delete family' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Family deleted successfully'
      });

   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}
