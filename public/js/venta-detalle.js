const API = "https://contaemprende-production-eb68.up.railway.app";

const params = new URLSearchParams(window.location.search);
const ventaId = params.get("id");

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
    // Actualizar el ID en el header INMEDIATAMENTE
    actualizarIdHeader(ventaId);
    
    try {
        // ✅ CAMBIO AQUÍ - Agregar /api
        const res = await fetch(`${API}/api/ventas/detalle/${ventaId}`);
        const json = await res.json();

        if (!json.ok) throw new Error("Venta no encontrada");

        const v = json.venta;

        // Información general
        document.querySelector("#infoVenta").innerHTML = `
            <div class="info-item">
                <label>Cliente</label>
                <span>${v.cliente.nombre}</span>
            </div>
            <div class="info-item">
                <label>N° Factura</label>
                <span>${v.num_factura}</span>
            </div>
            <div class="info-item">
                <label>N° Autorización</label>
                <span>${v.num_autorizacion}</span>
            </div>
            <div class="info-item">
                <label>Fecha</label>
                <span>${new Date(v.fecha_emision).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
                <label>Forma de pago</label>
                <span>${v.forma_pago}</span>
            </div>
            <div class="info-item">
                <label>Estado</label>
                <span>${v.estado}</span>
            </div>
            <div class="info-item">
                <label>Total</label>
                <span>$${v.total.toFixed(2)}</span>
            </div>
        `;

        // Actualizar badge de estado
        actualizarEstado(v.estado);

        // Totales
        document.querySelector("#baseTotal").textContent = v.base.toFixed(2);
        document.querySelector("#ivaTotal").textContent = v.iva.toFixed(2);
        document.querySelector("#totalFinal").textContent = v.total.toFixed(2);

        // Cargar productos
        cargarProductos(v.detalles);
        
        // Actualizar contador de productos
        actualizarContadorProductos(v.detalles.length);
        
    } catch (err) {
        console.error(err);
        alert("Error al cargar los detalles de la venta");
    }
}

// ... resto del código sin cambios