import { supabaseAdmin } from '@/lib/supabaseClient';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

/**
 * POST /api/admin/families
 * Create a new family
 */
export async function POST(request) {
   try {
      const data = await request.json();

      // Validate required fields
      if (!data.name || !data.qasba) {
         return Response.json(
            { error: 'Family name and qasba (slug) are required' },
            { status: 400 }
         );
      }

      // Create family using admin client (bypasses RLS)
      const { data: newFamily, error } = await supabaseAdmin
         .from('families')
         .insert([{
            name: data.name,
            qasba: data.qasba.toLowerCase(),
            focus_person_id: data.focus_person_id || null,
            description: data.description || null,
            region: data.region || null
         }])
         .select()
         .single();

      if (error) {
         if (error.code === '23505') {
            return Response.json(
               { error: 'Family name or qasba already exists' },
               { status: 400 }
            );
         }
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to create family' },
            { status: 500 }
         );
      }

      // Add focus person to family_persons if provided
      if (data.focus_person_id) {
         await supabaseAdmin
            .from('family_persons')
            .insert([{
               family_id: newFamily.id,
               person_id: data.focus_person_id,
               role: 'focus',
               is_primary: true
            }]);
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Family created successfully',
         data: newFamily
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
