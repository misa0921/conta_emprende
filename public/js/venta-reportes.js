const API = "https://contaemprende-production-eb68.up.railway.app/api";  // ⚠️ AGREGADO /api

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
    document.querySelector("#btnBuscar").addEventListener("click", buscar);
    document.querySelector("#btnExcel").addEventListener("click", descargarExcel);
});

async function cargarClientes() {
    try {
        const res = await fetch(`${API}/personas/clientes`);
        const json = await res.json();

        const select = document.querySelector("#clienteId");

        json.data.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
    } catch (error) {
        console.error("Error cargando clientes:", error);
        alert("Error al cargar clientes");
    }
}

async function buscar() {
    try {
        const filtros = {
            clienteId: document.querySelector("#clienteId").value,
            estado: document.querySelector("#estado").value,
            desde: document.querySelector("#desde").value,
            hasta: document.querySelector("#hasta").value
        };

        const query = new URLSearchParams(filtros);
        const res = await fetch(`${API}/ventas/reportes?${query.toString()}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const json = await res.json();
        
        if (!json.ok) {
            throw new Error(json.msg || "Error al obtener reportes");
        }
        
        renderTabla(json.data);

    } catch (error) {
        console.error("Error buscando ventas:", error);
        alert("Error al buscar ventas: " + error.message);
    }
}

function renderTabla(datos) {
    const tbody = document.querySelector("#tablaReportes tbody");
    tbody.innerHTML = "";

    if (!datos || datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    No se encontraron ventas con los filtros seleccionados
                </td>
            </tr>
        `;
        return;
    }

    datos.forEach(v => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${v.cliente?.nombre || "Sin cliente"}</td>
            <td>${v.num_factura || "Sin factura"}</td>
            <td>${new Date(v.fecha_emision).toLocaleDateString("es-ES")}</td>
            <td>$${Number(v.base || 0).toFixed(2)}</td>
            <td>$${Number(v.iva || 0).toFixed(2)}</td>
            <td>$${Number(v.total || 0).toFixed(2)}</td>
            <td><span class="badge badge-${v.estado.toLowerCase()}">${v.estado}</span></td>
        `;

        tbody.appendChild(tr);
    });
}

function descargarExcel() {
    try {
        const filtros = {
            clienteId: document.querySelector("#clienteId").value,
            estado: document.querySelector("#estado").value,
            desde: document.querySelector("#desde").value,
            hasta: document.querySelector("#hasta").value
        };

        const query = new URLSearchParams(filtros);

        // ⚠️ CORREGIDO: Agregado /api
        window.location.href = `${API}/ventas/reportes/excel?${query}`;
        
        console.log("✅ Descargando Excel...");
    } catch (error) {
        console.error("Error descargando Excel:", error);
        alert("Error al descargar Excel: " + error.message);
    }
}