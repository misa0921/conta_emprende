const API = "https://contaemprende-production-eb68.up.railway.app";
const ventaId = new URLSearchParams(window.location.search).get("id");

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarClientes();
    await cargarProductos();
    await cargarVenta();
    configurarAgregar();
    configurarGuardar();
  } catch (err) {
    console.error("Error inicializando página:", err);
  }
});

/* =====================================================
   Cargar clientes
===================================================== */
async function cargarClientes() {
  try {
    const res = await fetch(`${API}/api/personas/clientes`);

    const json = await res.json();

    const select = document.getElementById("clienteSelect");
    if (!select) throw new Error("No se encontró el select de clientes");

    select.innerHTML = "<option value=''>-- Seleccione un cliente --</option>";

    json.data.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      select.appendChild(opt);
    });

    select.disabled = true; // cliente NO editable
  } catch (err) {
    console.error("Error cargando clientes:", err);
  }
}

/* =====================================================
   Cargar lista completa de productos
===================================================== */
async function cargarProductos() {
  try {
    const res = await fetch(`${API}/api/productos`);
    const json = await res.json();

    window._productos = json.data;

    const select = document.getElementById("productoSelect");
    if (!select) throw new Error("No se encontró el select de productos");

    select.innerHTML = "<option value=''>-- Seleccione un producto --</option>";

    window._productos.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.nombre} (Stock: ${p.stock})`;
      opt.dataset.precio = p.precio_venta;
      select.appendChild(opt);
    });

    // Auto-rellenar precio al seleccionar producto
    select.addEventListener('change', function() {
      const precioInput = document.getElementById("precioUnit");
      if (this.value && this.selectedOptions[0]) {
        precioInput.value = this.selectedOptions[0].dataset.precio || '';
      }
    });
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

/* =====================================================
   Cargar venta desde la API
===================================================== */
async function cargarVenta() {
  try {
    const res = await fetch(`${API}/api/ventas/detalle/${ventaId}`);
    const json = await res.json();

    if (!json.ok || !json.venta) {
      alert("Venta no encontrada");
      return;
    }

    const venta = json.venta;

    // Obtener elementos
    const clienteSelect = document.getElementById("clienteSelect");
    const numFactura = document.getElementById("numFactura");
    const numAutorizacion = document.getElementById("numAutorizacion");
    const fechaEmision = document.getElementById("fechaEmision");
    const ivaTipo = document.getElementById("ivaTipo");
    const formaPago = document.getElementById("formaPago");

    if (clienteSelect) clienteSelect.value = venta.clienteId ?? "";
    if (numFactura) numFactura.value = venta.num_factura ?? "";
    if (numAutorizacion) numAutorizacion.value = venta.num_autorizacion ?? "";
    if (fechaEmision) fechaEmision.value = venta.fecha_emision ? venta.fecha_emision.split("T")[0] : "";
    if (ivaTipo) ivaTipo.value = venta.iva_tipo ?? "";
    if (formaPago) formaPago.value = venta.forma_pago ?? "";

    if (numFactura) numFactura.disabled = true;
    if (numAutorizacion) numAutorizacion.disabled = true;
    if (fechaEmision) fechaEmision.disabled = true;
    if (ivaTipo) ivaTipo.disabled = true;

    cargarDetalles(venta.detalles || []);
    recalcularTotales();
  } catch (err) {
    console.error("Error al cargar venta:", err);
  }
}

/* =====================================================
   Cargar detalles de venta - VERSIÓN LIMPIA
===================================================== */
function cargarDetalles(detalles) {
  const tbody = document.querySelector("#tablaDetalles tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  detalles.forEach(det => {
    // Intentar obtener el nombre del producto de diferentes formas
    let nombreProducto = det.nombre_producto 
                      || det.producto?.nombre 
                      || det.nombre 
                      || 'Producto sin nombre';
    
    agregarFilaDetalle({
      productoId: det.productoId || det.producto_id,
      productoNombre: nombreProducto,
      cantidad: det.cantidad,
      precio: det.precio_unit
    });
  });
}

/* =====================================================
   Agregar fila de detalle a la tabla
===================================================== */
function agregarFilaDetalle(data) {
  const tbody = document.querySelector("#tablaDetalles tbody");
  if (!tbody) return;

  const tr = document.createElement("tr");
  const subtotal = data.cantidad * data.precio;

  tr.dataset.productoId = data.productoId;
  tr.dataset.cantidad = data.cantidad;
  tr.dataset.precio = data.precio;

  tr.innerHTML = `
    <td class="producto-nombre">${data.productoNombre}</td>
    <td class="cantidad-texto">${data.cantidad}</td>
    <td class="precio-texto">${parseFloat(data.precio).toFixed(2)}</td>
    <td class="subtotal-texto">${subtotal.toFixed(2)}</td>
    <td class="td-accion">
      <button type="button" class="btn-eliminar-det">
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

  // Evento eliminar
  tr.querySelector(".btn-eliminar-det")?.addEventListener("click", () => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      tr.remove();
      recalcularTotales();
    }
  });
}

/* =====================================================
   Recalcular totales
===================================================== */
function recalcularTotales() {
  let base = 0;

  document.querySelectorAll("#tablaDetalles tbody tr").forEach(row => {
    const cantidad = Number(row.dataset.cantidad || 0);
    const precio = Number(row.dataset.precio || 0);
    const subtotal = cantidad * precio;
    base += subtotal;
  });

  const ivaTipo = document.getElementById("ivaTipo")?.value ?? "";
  const iva = ivaTipo === "QUINCE" ? +(base * 0.15).toFixed(2) : 0;
  const total = base + iva;

  const baseEl = document.getElementById("baseVenta");
  const ivaEl = document.getElementById("ivaVenta");
  const totalEl = document.getElementById("totalVenta");

  if (baseEl) baseEl.textContent = base.toFixed(2);
  if (ivaEl) ivaEl.textContent = iva.toFixed(2);
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

/* =====================================================
   Agregar producto nuevo
===================================================== */
function configurarAgregar() {
  document.getElementById("btnAgregar")?.addEventListener("click", () => {
    const prodSelect = document.getElementById("productoSelect");
    const prodId = prodSelect?.value;
    const cantidad = Number(document.getElementById("cantidad")?.value || 0);
    const precio = Number(document.getElementById("precioUnit")?.value || 0);

    if (!prodId) return alert("Seleccione un producto");
    if (cantidad <= 0) return alert("Cantidad inválida");
    if (precio <= 0) return alert("Precio inválido");

    // Verificar si ya existe el producto
    const existe = Array.from(document.querySelectorAll("#tablaDetalles tbody tr"))
      .some(row => row.dataset.productoId === prodId);
    
    if (existe) {
      return alert("Este producto ya está agregado. Elimínelo primero para modificarlo.");
    }

    // Obtener nombre del producto
    const productoNombre = prodSelect.selectedOptions[0]?.textContent.split('(Stock:')[0].trim() || '';

    // Agregar fila
    agregarFilaDetalle({
      productoId: prodId,
      productoNombre: productoNombre,
      cantidad: cantidad,
      precio: precio
    });

    // Limpiar campos
    prodSelect.value = '';
    document.getElementById("cantidad").value = '';
    document.getElementById("precioUnit").value = '';

    recalcularTotales();
  });
}

/* =====================================================
   Guardar cambios
===================================================== */
function configurarGuardar() {
  document.getElementById("btnGuardar")?.addEventListener("click", async () => {
    const detalles = Array.from(document.querySelectorAll("#tablaDetalles tbody tr")).map(row => ({
      productoId: Number(row.dataset.productoId),
      cantidad: Number(row.dataset.cantidad),
      precio_unit: Number(row.dataset.precio)
    }));

    if (detalles.length === 0) return alert("La venta debe tener productos");

    const payload = {
      clienteId: Number(document.getElementById("clienteSelect")?.value),
      num_factura: document.getElementById("numFactura")?.value,
      num_autorizacion: document.getElementById("numAutorizacion")?.value,
      fecha_emision: document.getElementById("fechaEmision")?.value,
      iva_tipo: document.getElementById("ivaTipo")?.value,
      forma_pago: document.getElementById("formaPago")?.value,
      detalles
    };

    try {
      const btnGuardar = document.getElementById("btnGuardar");
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<span>Guardando...</span>';

      const res = await fetch(`${API}/api/ventas/${ventaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      
      if (!json.ok) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<span>Guardar Cambios</span>';
        return alert("Error al actualizar: " + json.msg);
      }

      alert("Venta actualizada correctamente");
      window.location.href = `venta-detalle.html?id=${ventaId}`;
    } catch (err) {
      console.error("Error guardando venta:", err);
      alert("Error al guardar");
      
      const btnGuardar = document.getElementById("btnGuardar");
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '<span>Guardar Cambios</span>';
    }
  });
}