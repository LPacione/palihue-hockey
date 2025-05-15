let alineacion = {
  titulares: [],
  suplentes: []
};

let acciones = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('categoria').addEventListener('change', cargarJugadorasPorCategoria);
  document.getElementById('guardarAlineacion').addEventListener('click', guardarAlineacion);
  document.getElementById('registrarAccion').addEventListener('click', registrarAccion);
  document.getElementById('finalizarPartido').addEventListener('click', finalizarPartido);
});

async function cargarJugadorasPorCategoria() {
  const categoria = document.getElementById('categoria').value;
  if (!categoria) return;

  try {
    (async () => {
    // Realizamos la solicitud para obtener las jugadoras
    let response = await fetch(`/.netlify/functions/getJugadoras?categoria=${document.getElementById('categoria').value}`);
    
    // Verificamos si la respuesta fue exitosa
    if (!response.ok) {
        console.error("Error en la respuesta:", response.statusText);
        return;
    }

    // Obtenemos los datos de la respuesta
    let data = await response.json();
    console.log("Datos recibidos:", data); // Verifica que esto tenga la estructura esperada

    // Verificamos que el estado sea "success"
    if (data.status === "success") {
        let jugadoras = data.data;  // Aquí 'data' tiene la propiedad 'data' que es el array de nombres
        
        // Verificamos que 'jugadoras' no esté vacío
        if (jugadoras && jugadoras.length > 0) {
            // Limpiar la lista antes de agregar los nuevos elementos
            const listContainer = document.getElementById("jugadorasList");
            listContainer.innerHTML = "";  // Limpiar lista existente
            
            // Crear los elementos de la lista con los nombres de las jugadoras
            jugadoras.forEach(jugadora => {
                const listItem = document.createElement("li");
                listItem.innerText = jugadora;  // Mostrar el nombre de la jugadora
                listContainer.appendChild(listItem);
            });
        } else {
            console.error("No hay jugadoras disponibles.");
        }
    } else {
        console.error("Error al obtener las jugadoras:", data.message);
    }
    })();

    const titularesDiv = document.getElementById('titularesCheckboxes');
    const suplentesDiv = document.getElementById('suplentesCheckboxes');
    const selectJugadora = document.getElementById('jugadora');
    const selectQuienEntra = document.getElementById('quienEntra');

    // Limpiar anteriores
    titularesDiv.innerHTML = '';
    suplentesDiv.innerHTML = '';
    selectJugadora.innerHTML = '<option value="">Seleccione una jugadora</option>';
    selectQuienEntra.innerHTML = '<option value="">Seleccione una jugadora</option>';

    jugadoras.forEach(j => {
      // Titulares
      const checkboxTitular = document.createElement('input');
      checkboxTitular.type = 'checkbox';
      checkboxTitular.value = j.nombre;
      checkboxTitular.id = `titular-${j.nombre}`;
      const labelTitular = document.createElement('label');
      labelTitular.htmlFor = checkboxTitular.id;
      labelTitular.textContent = j.nombre;
      titularesDiv.appendChild(checkboxTitular);
      titularesDiv.appendChild(labelTitular);
      titularesDiv.appendChild(document.createElement('br'));

      // Suplentes
      const checkboxSuplente = document.createElement('input');
      checkboxSuplente.type = 'checkbox';
      checkboxSuplente.value = j.nombre;
      checkboxSuplente.id = `suplente-${j.nombre}`;
      const labelSuplente = document.createElement('label');
      labelSuplente.htmlFor = checkboxSuplente.id;
      labelSuplente.textContent = j.nombre;
      suplentesDiv.appendChild(checkboxSuplente);
      suplentesDiv.appendChild(labelSuplente);
      suplentesDiv.appendChild(document.createElement('br'));

      // Selects
      const option1 = document.createElement('option');
      option1.value = j.nombre;
      option1.textContent = j.nombre;
      selectJugadora.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = j.nombre;
      option2.textContent = j.nombre;
      selectQuienEntra.appendChild(option2);
    });

    document.getElementById('jugadora').disabled = false;
    document.getElementById('accion').disabled = false;

  } catch (err) {
    console.error("Error cargando jugadoras:", err);
  }
}

function guardarAlineacion() {
  alineacion.titulares = [];
  alineacion.suplentes = [];

  document.querySelectorAll('#titularesCheckboxes input[type=checkbox]:checked').forEach(cb => {
    alineacion.titulares.push(cb.value);
  });

  document.querySelectorAll('#suplentesCheckboxes input[type=checkbox]:checked').forEach(cb => {
    alineacion.suplentes.push(cb.value);
  });

  alert("Alineación guardada correctamente.");
}

function registrarAccion() {
  const jugadora = document.getElementById('jugadora').value;
  const accion = document.getElementById('accion').value;
  const minuto = document.getElementById('minuto').value;
  const quienEntra = document.getElementById('quienEntra').value;

  if (!jugadora || !accion || !minuto) {
    alert("Completa todos los campos de acción.");
    return;
  }

  // Validación adicional: solo ciertas acciones deberían tener 'quienEntra'
  if (accion === 'Salida' && !quienEntra) {
    alert("Debes seleccionar quién entra.");
    return;
  }

  const nuevaAccion = {
    jugadora,
    accion,
    minuto,
    quienEntra: accion === 'Salida' ? quienEntra : null
  };

  acciones.push(nuevaAccion);
  mostrarAcciones();
}


function mostrarAcciones() {
  const tabla = document.getElementById('tablaAcciones');
  tabla.innerHTML = `
    <tr>
      <th>Jugadora</th>
      <th>Acción</th>
      <th>Minuto</th>
      <th>Quién entra</th>
    </tr>
  `;

  acciones.forEach(a => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${a.jugadora}</td>
      <td>${a.accion}</td>
      <td>${a.minuto}</td>
      <td>${a.quienEntra || '-'}</td>
    `;
    tabla.appendChild(fila);
  });
}

function finalizarPartido() {
  const categoria = document.getElementById('categoria').value;
  const fecha = document.getElementById('fecha').value;

  if (!categoria || !fecha) {
    alert("Debes seleccionar una categoría y fecha.");
    return;
  }

  const datosFinales = {
    categoria,
    fecha,
    alineacion,
    acciones
  };

  console.log("Datos del partido:", datosFinales);

  // Aquí podrías hacer un fetch POST a una función que lo guarde en Google Sheets
  // Ejemplo:
  // fetch('/.netlify/functions/guardarPartido', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(datosFinales)
  // }).then(res => res.json()).then(data => console.log(data));

  alert("Partido finalizado. Los datos han sido registrados (revisá la consola).");
}

function actualizarCheckboxes(jugadoras) {
  const titularesDiv = document.getElementById('titularesCheckboxes');
  const suplentesDiv = document.getElementById('suplentesCheckboxes');
  const selectJugadora = document.getElementById('jugadora');
  const selectQuienEntra = document.getElementById('quienEntra');

  titularesDiv.innerHTML = '';
  suplentesDiv.innerHTML = '';
  selectJugadora.innerHTML = '<option value="">Seleccione una jugadora</option>';
  selectQuienEntra.innerHTML = '<option value="">Seleccione una jugadora</option>';

  jugadoras.forEach(j => {
    ['titulares', 'suplentes'].forEach(grupo => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = j;
      checkbox.id = `${grupo}-${j}`;
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = j;
      const div = grupo === 'titulares' ? titularesDiv : suplentesDiv;
      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(document.createElement('br'));
    });

    [selectJugadora, selectQuienEntra].forEach(select => {
      const option = document.createElement('option');
      option.value = j;
      option.textContent = j;
      select.appendChild(option);
    });
  });
}
