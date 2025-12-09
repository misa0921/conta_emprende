const API = "https://contaemprende-production-eb68.up.railway.app";

let detalles = [];
let productosMap = {};

document.addEventListener("DOMContentLoaded", async () => {
    await cargarClientes();
    await cargarProductos();

    document.getElementById("btnAgregar").addEventListener("click", agregarProducto);
    document.getElementById("btnGuardar").addEventListener("click", guardarVenta);

    document.getElementById("fechaEmision").value = new Date().toISOString().split("T")[0];

    // generar números por defecto
    document.getElementById("numFactura").value = generarNumeroAleatorio(15);
    document.getElementById("numAutorizacion").value = generarNumeroAleatorio(20);
});

/* ===================== Generar números ===================== */
    function generarNumeroAleatorio(digitos) {
    let num = "";
    for (let i = 0; i < digitos; i++) {
        num += Math.floor(Math.random() * 10);
    }
    return num;
    }

/* ===================== Cargar Clientes ===================== */
async function cargarClientes() {
    const res = await fetch(`${API}/personas`);
    const data = await res.json();

    const clientes = data.data.filter(p => p.tipo === "CLIENTE");
    const select = document.getElementById("clienteSelect");

    clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
}

/* ===================== Cargar Productos ===================== */
async function cargarProductos() {
    const res = await fetch(`${API}/productos`);
    const data = await res.json();

    const select = document.getElementById("productoSelect");

    data.data.forEach(p => {
        productosMap[p.id] = p;
        select.innerHTML += `<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`;
    });
}

/* ===================== Agregar Producto ===================== */
function agregarProducto() {
    const productoId = Number(document.getElementById("productoSelect").value);
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precioUnit").value);

    if (!productoId) return alert("Seleccione un producto");
    if (cantidad <= 0) return alert("Cantidad inválida");
    if (precio <= 0) return alert("Ingrese un precio válido");

    const producto = productosMap[productoId];
    const subtotal = cantidad * precio;

    // NO permitir duplicados
    if (detalles.some(d => d.productoId === productoId)) {
        return alert("Este producto ya fue agregado");
    }

    detalles.push({
        productoId,
        nombre: producto.nombre,
        cantidad,
        precio_unit: precio,
        subtotal
    });

    renderDetalles();
}

/* ===================== Render Tabla ===================== */
function renderDetalles() {
    const tbody = document.querySelector("#tablaDetalles tbody");
    tbody.innerHTML = "";

    let base = 0;

    detalles.forEach((d, index) => {
        base += d.subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${d.nombre}</td>
                <td>${d.cantidad}</td>
                <td>$${d.precio_unit.toFixed(2)}</td>
                <td>$${d.subtotal.toFixed(2)}</td>
                <td><button onclick="eliminarDetalle(${index})">X</button></td>
            </tr>
        `;
    });

    document.getElementById("baseVenta").textContent = base.toFixed(2);

    const ivaTipo = document.getElementById("ivaTipo").value;
    const iva = (ivaTipo === "QUINCE") ? base * 0.15 : 0;

    document.getElementById("ivaVenta").textContent = iva.toFixed(2);
    document.getElementById("totalVenta").textContent = (base + iva).toFixed(2);
}

/* ===================== Eliminar producto ===================== */
function eliminarDetalle(index) {
    detalles.splice(index, 1);
    renderDetalles();
}

/* ===================== GUARDAR VENTA ===================== */
async function guardarVenta() {
    // Validar que se haya agregado al menos un producto
    if (detalles.length === 0) {
        alert("Agregue productos antes de continuar");
        return;
    }

    const payload = {
        clienteId: Number(document.getElementById("clienteSelect").value),
        usuarioId: 1,
        num_factura: document.getElementById("numFactura").value,  // Este es el valor que envías
        num_autorizacion: document.getElementById("numAutorizacion").value,
        fecha_emision: document.getElementById("fechaEmision").value,
        iva_tipo: document.getElementById("ivaTipo").value,
        forma_pago: document.getElementById("formaPago").value,
        base: Number(document.getElementById("baseVenta").textContent),
        detalles // enviamos los detalles
    };

    console.log("PAYLOAD ENVIADO →", payload);  // Verifica que el número de factura está aquí

    try {
        const res = await fetch(`${API}/ventas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        console.log("Respuesta backend:", json);

        if (!json.ok) return alert("❌ Error: " + json.msg);

        alert("Venta registrada correctamente ✔");
    } catch (err) {
        console.error(err);
        alert("Error conectando con el servidor");
    }
}
