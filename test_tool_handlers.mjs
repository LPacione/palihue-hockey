import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

// Import the tools dynamically after environment is loaded
const {
  getMatchesTool,
  getMatchStatsTool,
  getMatchActionsTool,
  getPlayerStatsTool,
  getPlayersTool
} = await import('./api/agent.js');

async function runTests() {
  console.log("=== STARTING DATABASE TOOL TESTS ===\n");

  try {
    // 1. Test getMatchesTool with category
    console.log("1. Testing getMatchesTool (filter: 1ra_fem)...");
    const matchesRes = await getMatchesTool.execute({ categoria: '1ra_fem' });
    const matches = JSON.parse(matchesRes);
    console.log(`- Success! Returned ${matches.length} matches.`);
    if (matches.length > 0) {
      console.log(`- Sample match: Fecha = ${matches[0].partido_fecha}, Categoria = ${matches[0].categoria}, Goles = ${matches[0].goles_propios_totales}-${matches[0].goles_rival_totales}`);
    }

    // 2. Test getPlayerStatsTool with partial name
    console.log("\n2. Testing getPlayerStatsTool (name: 'Manque')...");
    const playerStatsRes = await getPlayerStatsTool.execute({ nombre: 'Manque' });
    const playerStats = JSON.parse(playerStatsRes);
    console.log(`- Success! Returned ${playerStats.length} records.`);
    if (playerStats.length > 0) {
      console.log(`- Sample record: Jugadora = ${playerStats[0].jugadora_nombre}, Fecha = ${playerStats[0].partido_fecha}, Goles = ${playerStats[0].goles}, Minutos = ${playerStats[0].tiempo_jugado}`);
    }

    // 3. Test getPlayerStatsTool with full name
    console.log("\n3. Testing getPlayerStatsTool (name: 'Manque Gimenes, Catalina')...");
    const playerStatsFullRes = await getPlayerStatsTool.execute({ nombre: 'Manque Gimenes, Catalina' });
    const playerStatsFull = JSON.parse(playerStatsFullRes);
    console.log(`- Success! Returned ${playerStatsFull.length} records.`);

    // 4. Test getPlayersTool with category
    console.log("\n4. Testing getPlayersTool (category: '1ra_fem')...");
    const playersRes = await getPlayersTool.execute({ categoria: '1ra_fem' });
    const players = JSON.parse(playersRes);
    console.log(`- Success! Returned ${players.length} players.`);
    if (players.length > 0) {
      console.log(`- Sample player: ${players[0].nombre} (Cat: ${players[0].categoria}, Cat2: ${players[0].categoria_segunda})`);
    }

  } catch (e) {
    console.error("Test failed with exception:", e);
  }

  console.log("\n=== DATABASE TOOL TESTS COMPLETED ===");
}

runTests();
