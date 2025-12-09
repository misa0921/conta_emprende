document.addEventListener("DOMContentLoaded", () => cargarCompras());

async function cargarCompras() {
    try {
        const res = await fetch("http://localhost:3000/api/compras");
        const json = await res.json();

        const compras = json.compras ?? json.data;
        if (!Array.isArray(compras)) throw new Error("Respuesta inválida");

        renderTabla(compras);
    } catch (err) {
        console.error("Error:", err);
        alert("Error cargando compras");
    }
}

function renderTabla(compras) {
    const tbody = document.querySelector("#tablaCompras tbody");
    tbody.innerHTML = "";

    compras.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.id}</td>
            <td>${c.proveedor?.nombre ?? "—"}</td>
            <td>${c.num_factura}</td>
            <td>${new Date(c.fecha_emision).toLocaleDateString()}</td>
            <td>$${c.total.toFixed(2)}</td>
            <td class="${c.estado === "PAGADA" ? "pagada" : "pendiente"}">${c.estado}</td>
            <td>
                <button class="btn-acciones" onclick="abrirMenu(${c.id})">
                    Acciones
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function abrirMenu(id) {
    const opciones = `
        1) Ver detalles\n
        2) Pagar compra\n
        3) Actualizar compra\n
        4) Cancelar
    `;

    const opcion = prompt(opciones);

    switch (opcion) {
        case "1":
            window.location.href = `compra-detalle.html?id=${id}`;
            break;

        case "2":
            window.location.href = `compra-pagar.html?id=${id}`;
            break;

        case "3":
            window.location.href = `compra-editar.html?id=${id}`;
            break;

        default:
            break;
    }
}
