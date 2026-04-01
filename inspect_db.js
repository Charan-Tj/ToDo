require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: boards } = await supabase.from('boards').select('id, name, visibility');
  console.log("BOARDS:");
  console.table(boards.map(b => ({ id: b.id.substring(0,8), name: b.name, vis: b.visibility })));

  const { data: copyflow } = await supabase.from('boards').select('id, name').ilike('name', '%copyflow%').single();
  if (copyflow) {
    console.log("Found copyflow board:", copyflow.id);
    const { data: lists } = await supabase.from('lists').select('id, title, assignee_email').eq('board_id', copyflow.id);
    console.log("LISTS in copyflow:");
    console.table(lists);
    
    // Attempting mapping based on request!
    // If the SQL column has NOT been added, this will throw, but let's try.
    // We update lists named "charan", "pankaj", "subodh" in copyflow.
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
main().catch(console.error);
