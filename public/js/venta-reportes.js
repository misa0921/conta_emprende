const API = "https://contaemprende-production-eb68.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
    document.querySelector("#btnBuscar").addEventListener("click", buscar);
    document.querySelector("#btnExcel").addEventListener("click", descargarExcel);
});

async function cargarClientes() {
    const res = await fetch(`${API}/personas/clientes`);
    const json = await res.json();

    const select = document.querySelector("#clienteId");

    json.data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
}

async function buscar() {

    const filtros = {
        clienteId: document.querySelector("#clienteId").value,
        estado: document.querySelector("#estado").value,
        desde: document.querySelector("#desde").value,
        hasta: document.querySelector("#hasta").value
    };

    const query = new URLSearchParams(filtros);
    const res = await fetch(`${API}/ventas/reportes?${query.toString()}`);
    const json = await res.json();
    renderTabla(json.data);

}

function renderTabla(datos) {
    const tbody = document.querySelector("#tablaReportes tbody");
    tbody.innerHTML = "";

    datos.forEach(v => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${v.cliente.nombre}</td>
            <td>${v.num_factura}</td>
            <td>${new Date(v.fecha_emision).toLocaleDateString()}</td>
            <td>$${v.base.toFixed(2)}</td>
            <td>$${v.iva.toFixed(2)}</td>
            <td>$${v.total.toFixed(2)}</td>
            <td>${v.estado}</td>
        `;

        tbody.appendChild(tr);
    });
}

function descargarExcel() {
    const filtros = {
        clienteId: document.querySelector("#clienteId").value,
        estado: document.querySelector("#estado").value,
        desde: document.querySelector("#desde").value,
        hasta: document.querySelector("#hasta").value
    };

    const query = new URLSearchParams(filtros);

        window.location.href = `${API}/ventas/reportes/excel?${query}`;
}
