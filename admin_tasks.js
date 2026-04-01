require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Renaming 'daily' board to 'Personal'...");
  const { data: boardsData, error: boardsError } = await supabase
    .from('boards')
    .update({ name: 'Personal' })
    .match({ name: 'daily', visibility: 'personal' })
    .select();
    
  console.log(boardsError ? `Error renaming boards: ${boardsError.message}` : `Successfully renamed ${boardsData?.length} boards.`);

  // Mapping lists in 'copyflow' board
  const { data: copyflow } = await supabase.from('boards').select('id, name').ilike('name', '%copyflow%').single();
  if (copyflow) {
    console.log("Found copyflow board:", copyflow.id);
    const { data: lists, error: listsError } = await supabase.from('lists').select('*').eq('board_id', copyflow.id);
    
    if (listsError) {
       console.log("Could not fetch lists (did you add the assignee_email column yet?)", listsError.message);
    } else if (lists) {
       const map = {
         'charan': 'charan@copyflow.in',
         'pankaj': 'pankaj@copyflow.in',
         'subodh': 'subodh@copyflow.in'
       };

       for (let l of lists) {
         if (map[l.title.toLowerCase()]) {
           console.log(`Setting assignee for ${l.title} to ${map[l.title.toLowerCase()]}`);
           const { error } = await supabase.from('lists').update({ assignee_email: map[l.title.toLowerCase()] }).eq('id', l.id);
           if (error) console.log(`FAILED setting assignee for ${l.title}:`, error.message);
         }
       }
    }
  }
}

main().catch(console.error);
