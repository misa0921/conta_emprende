const params = new URLSearchParams(window.location.search);
const compraId = params.get("id");

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
    try {
    const res = await fetch(`https://contaemprende-production-eb68.up.railway.app/api/compras/detalle/${compraId}`);
        const json = await res.json();

        if (!json.ok) throw new Error("Compra no encontrada");

        const c = json.compra;

        document.querySelector("#infoCompra").innerHTML = `
            <p><strong>Proveedor:</strong> ${c.proveedor.nombre}</p>
            <p><strong>N° Factura:</strong> ${c.num_factura}</p>
            <p><strong>N° Autorización:</strong> ${c.num_autorizacion}</p>
            <p><strong>Fecha:</strong> ${new Date(c.fecha_emision).toLocaleDateString()}</p>
            <p><strong>Forma de Pago:</strong> ${c.forma_pago}</p>
            <p><strong>Estado:</strong> ${c.estado}</p>
            <p><strong>Total:</strong> $${c.total}</p>
        `;
                // ======== SECCIÓN DE TOTALES (ESTO FALTABA) ========
        document.querySelector("#baseTotal").textContent = c.base.toFixed(2);
        document.querySelector("#ivaTotal").textContent = c.iva.toFixed(2);
        document.querySelector("#totalFinal").textContent = c.total.toFixed(2);

        cargarProductos(c.detalles);
    } catch (err) {
        alert("Error al cargar detalle");
        console.error(err);
    }
}

function cargarProductos(detalles) {
    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";

    detalles.forEach(d => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${d.producto.nombre}</td>
            <td>${d.cantidad}</td>
            <td>$${d.precio_unit}</td>
            <td>$${d.subtotal}</td>
        `;

        tbody.appendChild(tr);
    });
}

document.querySelector("#btnEditar")
    .addEventListener("click", () => {
        window.location.href = `compra-editar.html?id=${compraId}`;
    });
