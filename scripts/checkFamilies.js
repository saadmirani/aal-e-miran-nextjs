const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials
const supabaseUrl = 'https://kznmogwopezbcynbbcxc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bm1vZ3dvcGV6YmN5bmJiY3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMzAyOSwiZXhwIjoyMDkyMDk5MDI5fQ.e-lQ8jT8ipWfwr3ghUh45V_yT5H8sHvvstxRjhxPyVo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkFamilies() {
   try {
      console.log('🔍 Fetching all families...\n');

      const { data: families, error } = await supabase
         .from('families')
         .select('*')
         .order('name', { ascending: true });

      if (error) {
         console.error('❌ Error fetching families:', error);
         return;
      }

      console.log(`📊 Total families: ${families.length}\n`);

      families.forEach((family, index) => {
         console.log(`${index + 1}. Name: ${family.name}`);
         console.log(`   ID: ${family.id}`);
         console.log(`   Qasba: ${family.qasba}`);
         console.log(`   Region: ${family.region || 'N/A'}`);
         console.log();
      });

      // Now check how many persons are in each family
      console.log('\n📈 Persons per family:\n');

      for (const family of families) {
         const { count } = await supabase
            .from('family_persons')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id);

         console.log(`${family.name} (${family.id}): ${count} persons`);
      }

   } catch (error) {
      console.error('Fatal error:', error);
   }
}

checkFamilies();
