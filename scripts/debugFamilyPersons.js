const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kznmogwopezbcynbbcxc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bm1vZ3dvcGV6YmN5bmJiY3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMzAyOSwiZXhwIjoyMDkyMDk5MDI5fQ.e-lQ8jT8ipWfwr3ghUh45V_yT5H8sHvvstxRjhxPyVo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugFamilyPersons() {
   try {
      console.log('🔍 Checking family_persons table...\n');

      // Get ALL family_persons records
      const { data: allFP } = await supabase
         .from('family_persons')
         .select('*');

      console.log(`📊 Total family_persons records: ${allFP.length}\n`);

      // Group by family_id
      const byFamily = {};
      allFP.forEach(fp => {
         if (!byFamily[fp.family_id]) {
            byFamily[fp.family_id] = [];
         }
         byFamily[fp.family_id].push(fp);
      });

      for (const [familyId, records] of Object.entries(byFamily)) {
         console.log(`Family ID: ${familyId}`);
         console.log(`  Records: ${records.length}`);
         records.forEach((r, idx) => {
            console.log(`    ${idx + 1}. person_id: ${r.person_id}, created: ${r.created_at}`);
         });
         console.log();
      }

   } catch (error) {
      console.error('❌ Error:', error.message);
   }
}

debugFamilyPersons();
