const API = "http://localhost:3000/api";

let detalles = [];
let productosMap = {};

document.addEventListener("DOMContentLoaded", async () => {
    await cargarProveedores();
    await cargarProductos();

    document.getElementById("btnAgregar").addEventListener("click", agregarProducto);
    document.getElementById("btnGuardar").addEventListener("click", guardarCompra);

    document.getElementById("fechaEmision").value = new Date().toISOString().split("T")[0];
    
        document.getElementById("numFactura").value = generarNumeroAleatorio(15);
    document.getElementById("numAutorizacion").value = generarNumeroAleatorio(20);
});

// ===================== Generar números aleatorios =====================
function generarNumeroAleatorio(digitos) {
    let num = "";
    for (let i = 0; i < digitos; i++) {
        num += Math.floor(Math.random() * 10); // cada dígito 0-9
    }
    return num;
}

// ===================== Cargar proveedores =====================
async function cargarProveedores() {
    const res = await fetch(`${API}/personas`);
    const data = await res.json();

    const proveedores = data.data.filter(p => p.tipo === "PROVEEDOR");
    const select = document.getElementById("proveedorSelect");

    proveedores.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
}

// ===================== Cargar productos =====================
async function cargarProductos() {
    const res = await fetch(`${API}/productos`);
    const data = await res.json();

    const select = document.getElementById("productoSelect");

    data.data.forEach(p => {
        productosMap[p.id] = p;
        select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
}

// ===================== Agregar producto =====================
function agregarProducto() {
    const productoId = Number(document.getElementById("productoSelect").value);
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precioUnit").value);

    if (!precio || precio <= 0) {
        alert("Ingrese un precio válido");
        return;
    }

    const producto = productosMap[productoId];
    const subtotal = cantidad * precio;

    detalles.push({
        productoId,
        nombre: producto.nombre,
        cantidad,
        precio_unit: precio,
        subtotal
    });

    renderDetalles();
}

// ===================== Render Tabla =====================
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

    document.getElementById("baseCompra").textContent = base.toFixed(2);

    const ivaTipo = document.getElementById("ivaTipo").value;
    const iva = (ivaTipo === "QUINCE") ? base * 0.15 : 0;

    document.getElementById("ivaCompra").textContent = iva.toFixed(2);
    document.getElementById("totalCompra").textContent = (base + iva).toFixed(2);
}

// ===================== Eliminar item =====================
function eliminarDetalle(index) {
    detalles.splice(index, 1);
    renderDetalles();
}

// ===================== GUARDAR COMPRA =====================
async function guardarCompra() {
    if (detalles.length === 0) {
        alert("Agregue productos antes de guardar");
        return;
    }

    const formaPagoSeleccionada = document.getElementById("formaPago").value;

    console.log("============ DEBUG ============");
    console.log("FORMA DE PAGO SELECCIONADA →", formaPagoSeleccionada);

    // Generar números aleatorios
    const numFactura = generarNumeroAleatorio(15);
    const numAutorizacion = generarNumeroAleatorio(20);

    const payload = {
        proveedorId: Number(document.getElementById("proveedorSelect").value),
        usuarioId: 1,
        num_factura: numFactura,
        num_autorizacion: numAutorizacion,
        fecha_emision: document.getElementById("fechaEmision").value,
        iva_tipo: document.getElementById("ivaTipo").value,
        forma_pago: formaPagoSeleccionada,
        base: Number(document.getElementById("baseCompra").textContent),
        detalles
    };

    console.log("PAYLOAD ENVIADO →", payload);

    try {
        const res = await fetch(`${API}/compras`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("RESPUESTA BACKEND →", data);

        if (!data.ok) return alert("❌ Error: " + data.msg);

        alert("Compra guardada exitosamente ✔");
        location.reload();

    } catch (err) {
        console.error(err);
        alert("Error al conectar con servidor");
    }
}
