const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://kznmogwopezbcynbbcxc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bm1vZ3dvcGV6YmN5bmJiY3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMzAyOSwiZXhwIjoyMDkyMDk5MDI5fQ.e-lQ8jT8ipWfwr3ghUh45V_yT5H8sHvvstxRjhxPyVo';

if (!supabaseUrl || !serviceRoleKey) {
   console.error('❌ Missing Supabase credentials');
   process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteAllData() {
   try {
      console.log('🗑️  Starting data deletion...\n');

      // Delete in order (respecting foreign key constraints)
      const tables = [
         'burial_info',
         'marriages',
         'family_persons',
         'persons',
         'families'
      ];

      for (const table of tables) {
         console.log(`📋 Deleting all records from ${table}...`);

         const { count, error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete everything
            .select('*', { count: 'exact', head: true });

         if (error) {
            console.error(`   ❌ Error deleting from ${table}:`, error);
         } else {
            console.log(`   ✅ Deleted ${count} records from ${table}`);
         }
      }

      console.log('\n✅ Deletion complete! Database is now empty.');

      // Verify tables are empty
      console.log('\n🔍 Verifying deletion...');
      for (const table of tables) {
         const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

         if (error) {
            console.error(`   ❌ Error verifying ${table}:`, error);
         } else {
            console.log(`   📊 ${table}: ${count} records`);
         }
      }

   } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
   }
}

deleteAllData();
