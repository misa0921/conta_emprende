// compra-editar.js - VERSION MEJORADA CON DISEÑO LIMPIO

const compraId = new URLSearchParams(window.location.search).get("id");

let detallesCompra = [];

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarProveedores();
    await cargarProductos();
    await cargarCompra();
    configurarAgregar();
    configurarGuardar();
  } catch (err) {
    console.error("Error inicializando página:", err);
  }
});

/* =====================================================
   Cargar proveedores (solo mostrar, NO editar)
===================================================== */
async function cargarProveedores() {
  try {
    const res = await fetch("http://localhost:3000/api/personas/proveedores");
    const json = await res.json();
    const select = document.getElementById("proveedorSelect");
    select.innerHTML = "<option value=''>-- Seleccione proveedor --</option>";

    const lista = json.data ?? json;
    lista.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      select.appendChild(opt);
    });

    select.disabled = true;
    return lista;
  } catch (err) {
    console.error("Error cargando proveedores:", err);
    return [];
  }
}

/* =====================================================
   Cargar lista completa de productos
===================================================== */
async function cargarProductos() {
  try {
    const res = await fetch("http://localhost:3000/api/productos");
    const json = await res.json();
    const lista = json.data ?? json;

    window._productos = lista || [];

    const select = document.getElementById("productoSelect");
    if (select) {
      select.innerHTML = "<option value=''>-- Seleccione un producto --</option>";
      window._productos.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.nombre} (Stock: ${p.stock ?? 0})`;
        opt.dataset.precio = p.precio_compra || 0;
        select.appendChild(opt);
      });
    }

    // Auto-rellenar precio al seleccionar producto
    select.addEventListener('change', function() {
      const precioInput = document.getElementById("precioUnit");
      if (this.value && this.selectedOptions[0]) {
        precioInput.value = this.selectedOptions[0].dataset.precio || '';
      }
    });

    return window._productos;
  } catch (err) {
    console.error("Error cargando productos:", err);
    window._productos = [];
    return [];
  }
}

/* =====================================================
   Cargar compra desde la API
===================================================== */
async function cargarCompra() {
  try {
    const res = await fetch(`http://localhost:3000/api/compras/detalle/${compraId}`);
    const json = await res.json();

    if (!json.ok) {
      alert("Compra no encontrada");
      return;
    }

    const compra = json.compra ?? json.data ?? json;

    document.getElementById("proveedorSelect").value = compra.proveedorId;
    document.getElementById("numFactura").value = compra.num_factura;
    document.getElementById("numAutorizacion").value = compra.num_autorizacion;
    document.getElementById("fechaEmision").value = (compra.fecha_emision ?? "").split("T")[0];
    document.getElementById("ivaTipo").value = compra.iva_tipo ?? "CERO";
    document.getElementById("formaPago").value = compra.forma_pago ?? "BANCO";

    document.getElementById("numFactura").disabled = true;
    document.getElementById("numAutorizacion").disabled = true;
    document.getElementById("fechaEmision").disabled = true;
    document.getElementById("ivaTipo").disabled = true;

    if (!window._productos || window._productos.length === 0) {
      await cargarProductos();
    }

    // Cargar detalles en el array
    detallesCompra = (compra.detalles ?? []).map(det => ({
      productoId: det.productoId,
      productoNombre: det.producto?.nombre || det.nombre || 'Producto',
      cantidad: det.cantidad,
      precio: det.precio_unit
    }));

    renderizarTabla();
    recalcularTotales();
  } catch (err) {
    console.error("Error al cargar compra:", err);
  }
}

/* =====================================================
   Renderizar tabla con diseño limpio
===================================================== */
function renderizarTabla() {
  const tbody = document.querySelector("#tablaDetalles tbody");
  tbody.innerHTML = "";

  detallesCompra.forEach((detalle, index) => {
    const tr = document.createElement("tr");
    const subtotal = detalle.cantidad * detalle.precio;

    tr.innerHTML = `
      <td class="producto-nombre">${detalle.productoNombre}</td>
      <td class="cantidad-texto">${detalle.cantidad}</td>
      <td class="precio-texto">$${parseFloat(detalle.precio).toFixed(2)}</td>
      <td class="subtotal-texto">$${subtotal.toFixed(2)}</td>
      <td class="td-accion">
        <button type="button" class="btn-eliminar-det" onclick="eliminarDetalle(${index})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          <span>Eliminar</span>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* =====================================================
   Eliminar detalle
===================================================== */
window.eliminarDetalle = function(index) {
  if (confirm("¿Eliminar este producto?")) {
    detallesCompra.splice(index, 1);
    renderizarTabla();
    recalcularTotales();
  }
};

/* =====================================================
   Recalcular totales
===================================================== */
function recalcularTotales() {
  const ivaTipo = document.getElementById("ivaTipo")?.value ?? "CERO";
  const tasaIva = ivaTipo === "QUINCE" ? 0.15 : 0;

  const base = detallesCompra.reduce((sum, d) => sum + (d.cantidad * d.precio), 0);
  const iva = base * tasaIva;
  const total = base + iva;

  document.getElementById("baseCompra").textContent = base.toFixed(2);
  document.getElementById("ivaCompra").textContent = iva.toFixed(2);
  document.getElementById("totalCompra").textContent = total.toFixed(2);
}

/* =====================================================
   Agregar producto nuevo
===================================================== */
function configurarAgregar() {
  const btn = document.getElementById("btnAgregar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const productoSelect = document.getElementById("productoSelect");
    const productoId = productoSelect.value;
    const cantidad = Number(document.getElementById("cantidad").value) || 0;
    const precioUnit = Number(document.getElementById("precioUnit").value) || 0;

    if (!productoId) return alert("Seleccione un producto");
    if (cantidad <= 0) return alert("Cantidad inválida");
    if (precioUnit <= 0) return alert("Precio inválido");

    // Verificar si ya existe
    const existe = detallesCompra.some(d => d.productoId == productoId);
    if (existe) {
      return alert("Este producto ya está agregado. Elimínelo primero para modificarlo.");
    }

    // Obtener nombre del producto
    const productoNombre = productoSelect.selectedOptions[0]?.textContent.split('(Stock:')[0].trim() || '';

    // Agregar al array
    detallesCompra.push({
      productoId: productoId,
      productoNombre: productoNombre,
      cantidad: cantidad,
      precio: precioUnit
    });

    // Limpiar campos
    productoSelect.value = '';
    document.getElementById("cantidad").value = '';
    document.getElementById("precioUnit").value = '';

    renderizarTabla();
    recalcularTotales();
  });
}

/* =====================================================
   Guardar cambios
===================================================== */
function configurarGuardar() {
  const btn = document.getElementById("btnGuardar");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (detallesCompra.length === 0) {
      return alert("La compra debe tener al menos un producto");
    }

    const btnGuardar = document.getElementById("btnGuardar");
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = `
      <svg class="spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <span>Guardando...</span>
    `;

    const payload = {
      proveedorId: Number(document.getElementById("proveedorSelect").value),
      num_factura: document.getElementById("numFactura").value,
      num_autorizacion: document.getElementById("numAutorizacion").value,
      fecha_emision: document.getElementById("fechaEmision").value,
      iva_tipo: document.getElementById("ivaTipo").value,
      forma_pago: document.getElementById("formaPago").value,
      detalles: detallesCompra.map(d => ({
        productoId: Number(d.productoId),
        cantidad: d.cantidad,
        precio_unit: d.precio
      }))
    };

    try {
      const res = await fetch(`http://localhost:3000/api/compras/${compraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!json.ok) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Guardar Cambios</span>
        `;
        return alert("Error al actualizar: " + (json.msg || ""));
      }

      alert("Compra actualizada correctamente");
      window.location.href = `compra-detalle.html?id=${compraId}`;

    } catch (err) {
      console.error("Error guardando compra:", err);
      alert("Error guardando compra");

      btnGuardar.disabled = false;
      btnGuardar.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span>Guardar Cambios</span>
      `;
    }
  });
}