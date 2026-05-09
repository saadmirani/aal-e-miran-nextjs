import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { requireEditorAuth } from '@/lib/editorAuth';
import { bustFamilyTreeCache } from '@/lib/familyTreeCache';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/persons/:personId
 * Update a person
 */
export async function PUT(request, { params }) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();
      const { personId } = params;
      const data = await request.json();

      const updatePayload = {
         name: data.name || undefined,
         gender: data.gender || undefined,
         alive: data.alive !== undefined ? data.alive : undefined,
         is_lawald: data.is_lawald !== undefined ? data.is_lawald === true : undefined,
         date_of_birth: data.date_of_birth !== undefined ? (data.date_of_birth || null) : undefined,
         date_of_death: data.date_of_death !== undefined ? (data.date_of_death || null) : undefined,
         place_of_birth: data.place_of_birth !== undefined ? (data.place_of_birth || null) : undefined,
         place_of_death: data.place_of_death !== undefined ? (data.place_of_death || null) : undefined,
         about: data.about !== undefined ? (data.about || null) : undefined,
         father_id: data.father_id !== undefined ? (data.father_id || null) : undefined,
         mother_id: data.mother_id !== undefined ? (data.mother_id || null) : undefined,
         father_name: data.father_name !== undefined ? (data.father_name || null) : undefined,
         display_badge: data.display_badge !== undefined ? (data.display_badge?.trim() || null) : undefined,
         updated_at: new Date().toISOString()
      };

      let updatedPerson = null;
      let error = null;

      const primaryUpdate = await supabase
         .from('persons')
         .update(updatePayload)
         .eq('id', personId)
         .select()
         .single();

      if (primaryUpdate.error && /father_name|display_badge|is_lawald/i.test(primaryUpdate.error.message || '')) {
         const { father_name, display_badge, is_lawald, ...fallbackPayload } = updatePayload;
         const fallbackUpdate = await supabase
            .from('persons')
            .update(fallbackPayload)
            .eq('id', personId)
            .select()
            .single();
         updatedPerson = fallbackUpdate.data;
         error = fallbackUpdate.error;
      } else {
         updatedPerson = primaryUpdate.data;
         error = primaryUpdate.error;
      }

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: 'Failed to update person' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Person updated successfully',
         data: updatedPerson
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
 * DELETE /api/admin/persons/:personId
 * Delete a person
 */
export async function DELETE(request, { params }) {
   try {
      const authResult = await requireEditorAuth();
      if (authResult instanceof Response) return authResult;

      const supabase = getSupabaseAdmin();
      const { personId } = params;

      const { data: existingPerson, error: checkError } = await supabase
         .from('persons')
         .select('id, name')
         .eq('id', personId)
         .maybeSingle();

      if (checkError) {
         console.error('Supabase pre-delete check error:', checkError);
         return Response.json(
            { error: 'Failed to validate person before delete' },
            { status: 500 }
         );
      }

      if (!existingPerson) {
         return Response.json(
            { error: 'Person not found or already deleted' },
            { status: 404 }
         );
      }

      // If this person is a focus person for any family, reassign focus where possible.
      // families.focus_person_id has ON DELETE RESTRICT, so deletion otherwise fails.
      const { data: focusFamilies = [], error: focusFamiliesError } = await supabase
         .from('families')
         .select('id, name, qasba')
         .eq('focus_person_id', personId);

      if (focusFamiliesError) {
         console.error('Supabase focus family lookup error:', focusFamiliesError);
         return Response.json(
            { error: 'Failed to validate family focus references before delete' },
            { status: 500 }
         );
      }

      const blockedFamilies = [];
      for (const family of focusFamilies) {
         const { data: replacement, error: replacementError } = await supabase
            .from('family_persons')
            .select('person_id')
            .eq('family_id', family.id)
            .neq('person_id', personId)
            .limit(1)
            .maybeSingle();

         if (replacementError) {
            console.error('Supabase replacement focus lookup error:', replacementError);
            return Response.json(
               { error: 'Failed to resolve replacement focus person before delete' },
               { status: 500 }
            );
         }

         if (!replacement?.person_id) {
            blockedFamilies.push(`${family.name || family.qasba || family.id}`);
            continue;
         }

         const { error: reassignError } = await supabase
            .from('families')
            .update({ focus_person_id: replacement.person_id })
            .eq('id', family.id);

         if (reassignError) {
            console.error('Supabase focus reassign error:', reassignError);
            return Response.json(
               { error: 'Failed to reassign family focus person before delete' },
               { status: 500 }
            );
         }
      }

      if (blockedFamilies.length > 0) {
         return Response.json(
            {
               error: `Cannot delete person because they are focus person for family/families with no replacement member: ${blockedFamilies.join(', ')}`
            },
            { status: 409 }
         );
      }

      // Explicitly delete marriages involving this person (no DB cascade guaranteed)
      const { error: marriagesCleanupError } = await supabase
         .from('marriages')
         .delete()
         .or(`spouse1_id.eq.${personId},spouse2_id.eq.${personId}`);

      if (marriagesCleanupError) {
         console.error('Supabase marriages cleanup error:', marriagesCleanupError);
         return Response.json(
            { error: marriagesCleanupError.message || 'Failed to clean marriages before delete' },
            { status: 500 }
         );
      }

      // Nullify any father_id / mother_id references pointing to this person
      const { error: fatherNullifyError } = await supabase.from('persons').update({ father_id: null }).eq('father_id', personId);
      if (fatherNullifyError) {
         console.error('Supabase father reference nullify error:', fatherNullifyError);
         return Response.json(
            { error: fatherNullifyError.message || 'Failed to nullify father references before delete' },
            { status: 500 }
         );
      }

      const { error: motherNullifyError } = await supabase.from('persons').update({ mother_id: null }).eq('mother_id', personId);
      if (motherNullifyError) {
         console.error('Supabase mother reference nullify error:', motherNullifyError);
         return Response.json(
            { error: motherNullifyError.message || 'Failed to nullify mother references before delete' },
            { status: 500 }
         );
      }

      // Remove family memberships
      const { error: membershipsCleanupError } = await supabase.from('family_persons').delete().eq('person_id', personId);
      if (membershipsCleanupError) {
         console.error('Supabase memberships cleanup error:', membershipsCleanupError);
         return Response.json(
            { error: membershipsCleanupError.message || 'Failed to remove family memberships before delete' },
            { status: 500 }
         );
      }

      // Delete burial info
      const { error: burialCleanupError } = await supabase.from('burial_info').delete().eq('person_id', personId);
      if (burialCleanupError) {
         console.error('Supabase burial cleanup error:', burialCleanupError);
         return Response.json(
            { error: burialCleanupError.message || 'Failed to remove burial info before delete' },
            { status: 500 }
         );
      }

      // Finally delete the person
      const { error } = await supabase
         .from('persons')
         .delete()
         .eq('id', personId);

      if (error) {
         console.error('Supabase error:', error);
         return Response.json(
            { error: error.message || 'Failed to delete person' },
            { status: 500 }
         );
      }

      bustFamilyTreeCache();

      return Response.json({
         success: true,
         message: 'Person deleted successfully',
         data: { id: existingPerson.id, name: existingPerson.name }
      });

   } catch (error) {
      console.error('API Error:', error);
      return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}
