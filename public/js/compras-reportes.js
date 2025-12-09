const API = "https://contaemprende-production-eb68.up.railway.app/api";

document.addEventListener("DOMContentLoaded", () => {
    cargarProveedores();
    document.querySelector("#btnBuscar").addEventListener("click", buscar);
    document.querySelector("#btnExcel").addEventListener("click", descargarExcel);
});

async function cargarProveedores() {
    const res = await fetch(`${API}/personas/proveedores`);
    const json = await res.json();

    const select = document.querySelector("#proveedorId");

    json.data.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
}

async function buscar() {

    const filtros = {
        proveedorId: document.querySelector("#proveedorId").value,
        estado: document.querySelector("#estado").value,
        desde: document.querySelector("#desde").value,
        hasta: document.querySelector("#hasta").value
    };

    const query = new URLSearchParams(filtros);

    const res = await fetch(`${API}/compras/reportes?` + query);
    const json = await res.json();

    renderTabla(json.data);
}

function renderTabla(datos) {
    const tbody = document.querySelector("#tablaReportes tbody");
    tbody.innerHTML = "";

    datos.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.id}</td>
            <td>${c.proveedor.nombre}</td>
            <td>${c.num_factura}</td>
            <td>${new Date(c.fecha_emision).toLocaleDateString()}</td>
            <td>$${c.total.toFixed(2)}</td>
            <td>${c.estado}</td>
        `;

        tbody.appendChild(tr);
    });
}

function descargarExcel() {
    const filtros = {
        proveedorId: document.querySelector("#proveedorId").value,
        estado: document.querySelector("#estado").value,
        desde: document.querySelector("#desde").value,
        hasta: document.querySelector("#hasta").value
    };

    const query = new URLSearchParams(filtros);

    window.location.href = `${API}/compras/reportes/excel?` + query;
}
