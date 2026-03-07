import fs from 'fs';

const url = "https://unarlspebaqnvwxtlpbz.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYXJsc3BlYmFxbnZ3eHRscGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQwNTMsImV4cCI6MjA4ODA0MDA1M30.o0kE9ZZr8dJpoMD20gVFraMkerB8trvi7qS5KuuOvhM";

async function checkMissingCols() {
    const headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    let payload = {
        partido_fecha: '2023-01-01',
        categoria: 'Primera',
        jugadora_nombre: 'Test',
        tiempo_jugado: 60,
        goles: 0,
        gesto_bloqueo: 0,
        gesto_flick: 0,
        gesto_salida_linea: 0,
        gesto_salida_x: 0,
        gesto_salida_al_medio: 0,
        tarjeta_amarilla: 0,
        tarjeta_roja: 0,
        tarjeta_verde: 0,
        quite_positivo: 0,
        quite_negativo: 0,
        recuperacion: 0,
        falta_cometida: 0,
        falta_recibida: 0,
        pie: 0,
        perdida: 0,
        error_manejo: 0,
        corto_a_favor: 0,
        corto_en_contra: 0,
        tiro_al_arco: 0
    };

    let missingCols = [];
    while (true) {
        const res = await fetch(`${url}/resumen_jugadoras`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        if (res.status === 201) {
            console.log("Success! Extraneous removed:", missingCols);
            // Delete the dummy row
            await fetch(`${url}/resumen_jugadoras?partido_fecha=eq.2023-01-01`, {
                method: 'DELETE',
                headers
            });
            break;
        }
        const data = await res.json();
        if (data.code === 'PGRST204') {
            const match = data.message.match(/'([^']+)' column/);
            if (match && match[1]) {
                missingCols.push(match[1]);
                delete payload[match[1]];
                continue;
            }
        }
        console.log("Other error:", data);
        break;
    }
}
checkMissingCols();
