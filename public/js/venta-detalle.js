const params = new URLSearchParams(window.location.search);
const ventaId = params.get("id");

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
    // Actualizar el ID en el header INMEDIATAMENTE
    actualizarIdHeader(ventaId);
    
    try {
        const res = await fetch(`http://localhost:3000/api/ventas/detalle/${ventaId}`);
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

function actualizarIdHeader(id) {
    const ventaIdElement = document.getElementById('ventaId');
    if (ventaIdElement && id) {
        ventaIdElement.textContent = id;
    }
}

function actualizarEstado(estado) {
    const estadoBadge = document.getElementById('estadoBadge');
    if (estadoBadge) {
        estadoBadge.textContent = estado.toUpperCase();
        
        // Cambiar clase según el estado
        if (estado.toUpperCase() === 'COBRADA' || estado.toUpperCase() === 'PAGADA') {
            estadoBadge.className = 'badge badge-cobrada';
            
            // Deshabilitar botón cobrar si ya está cobrada
            const btnCobrar = document.getElementById('btnCobrar');
            if (btnCobrar) {
                btnCobrar.disabled = true;
                btnCobrar.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Ya Cobrada
                `;
                btnCobrar.style.opacity = '0.6';
                btnCobrar.style.cursor = 'not-allowed';
            }
        } else {
            estadoBadge.className = 'badge badge-pendiente';
        }
    }
}

function actualizarContadorProductos(cantidad) {
    const productCount = document.getElementById('productCount');
    if (productCount) {
        productCount.textContent = cantidad + ' producto' + (cantidad !== 1 ? 's' : '');
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
            <td>$${parseFloat(d.precio_unit).toFixed(2)}</td>
            <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Botón Editar
document.querySelector("#btnEditar")
    .addEventListener("click", () => {
        window.location.href = `venta-editar.html?id=${ventaId}`;
    });

// Botón Cobrar
document.querySelector("#btnCobrar")
    .addEventListener("click", () => {
        window.location.href = `venta-cobrar.html?id=${ventaId}`;
    });

// Exponer función globalmente para que el HTML pueda usarla si es necesario
window.actualizarVentaId = actualizarIdHeader;