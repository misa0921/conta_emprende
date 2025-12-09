const API = "https://contaemprende-production-eb68.up.railway.app";

document.addEventListener("DOMContentLoaded", () => cargarVentas());

async function cargarVentas() {
    try {
        const res = await fetch(`${API}/api/ventas`);
        const json = await res.json();

        const ventas = json.ventas ?? json.data;
        if (!Array.isArray(ventas)) throw new Error("Respuesta inválida del servidor");

        renderTabla(ventas);
    } catch (err) {
        console.error("Error cargando ventas:", err);
        alert("Error cargando ventas");
    }
}

function renderTabla(ventas) {
    const tbody = document.querySelector("#tablaVentas tbody");
    tbody.innerHTML = "";

    ventas.forEach(v => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${v.cliente?.nombre ?? "—"}</td>
            <td>${v.num_factura}</td>
            <td>${new Date(v.fecha_emision).toLocaleDateString()}</td>
            <td>$${v.total.toFixed(2)}</td>
            <td class="${v.estado === "COBRADA" ? "pagada" : "pendiente"}">${v.estado}</td>
            <td>
                <button class="btn-acciones" onclick="abrirMenu(${v.id})">
                    Acciones
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function abrirMenu(id) {
    const opciones = `
        ========== OPCIONES ==========
        1) Ver detalle
        2) Cobrar venta
        3) Editar venta
        4) Cancelar
    `;

    const opcion = prompt(opciones);

    switch (opcion) {
        case "1":
            window.location.href = `venta-detalle.html?id=${id}`;
            break;

        case "2":
            window.location.href = `venta-cobrar.html?id=${id}`;
            break;

        case "3":
            window.location.href = `venta-editar.html?id=${id}`;
            break;

        default:
            break;
    }
}
