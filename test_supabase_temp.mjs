import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Present:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  try {
    console.log("\n--- Querying resumen_partidos ---");
    const { data: partidos, error: errPartidos } = await supabase
      .from('resumen_partidos')
      .select('*')
      .limit(5);
    
    if (errPartidos) {
      console.error("Error resumen_partidos:", errPartidos);
    } else {
      console.log("resumen_partidos matches count:", partidos.length);
      console.log("Sample partidos:", partidos);
    }

    console.log("\n--- Querying resumen_jugadoras ---");
    const { data: jugadoras, error: errJugadoras } = await supabase
      .from('resumen_jugadoras')
      .select('*')
      .limit(5);
      
    if (errJugadoras) {
      console.error("Error resumen_jugadoras:", errJugadoras);
    } else {
      console.log("resumen_jugadoras count:", jugadoras.length);
      console.log("Sample jugadoras:", jugadoras);
    }

    console.log("\n--- Querying jugadoras table ---");
    const { data: rawJugadoras, error: errRawJugadoras } = await supabase
      .from('jugadoras')
      .select('*')
      .limit(5);
      
    if (errRawJugadoras) {
      console.error("Error jugadoras:", errRawJugadoras);
    } else {
      console.log("jugadoras count:", rawJugadoras.length);
      console.log("Sample rawJugadoras:", rawJugadoras);
    }

  } catch (e) {
    console.error("Exceptions:", e.message);
  }
}

testQuery();
