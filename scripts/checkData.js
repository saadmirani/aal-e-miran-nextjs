const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kznmogwopezbcynbbcxc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bm1vZ3dvcGV6YmN5bmJiY3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMzAyOSwiZXhwIjoyMDkyMDk5MDI5fQ.e-lQ8jT8ipWfwr3ghUh45V_yT5H8sHvvstxRjhxPyVo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkData() {
   try {
      console.log('🔍 Checking database content...\n');

      // Get Miran Bigha family
      const { data: family } = await supabase
         .from('families')
         .select('*')
         .eq('qasba', 'miran-bigha')
         .single();

      console.log('📍 Miran Bigha Family ID:', family.id);
      console.log();

      // Get all persons in this family
      const { data: familyPersons } = await supabase
         .from('family_persons')
         .select('*')
         .eq('family_id', family.id)
         .order('created_at', { ascending: false });

      console.log(`📊 Total persons in family: ${familyPersons.length}\n`);

      // Get details for each person
      const personIds = familyPersons.map(fp => fp.person_id);
      const { data: persons } = await supabase
         .from('persons')
         .select('*')
         .in('id', personIds);

      console.log('👥 Persons:\n');
      persons.forEach((person, idx) => {
         console.log(`${idx + 1}. Name: ${person.name}`);
         console.log(`   ID: ${person.id}`);
         console.log(`   Unique ID: ${person.unique_id}`);
         console.log(`   Created: ${person.created_at}`);
         console.log();
      });

   } catch (error) {
      console.error('❌ Error:', error.message);
   }
}

checkData();
