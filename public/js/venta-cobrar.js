/* ======================= 
     OBTENER ID DE VENTA 
======================= */
const params = new URLSearchParams(window.location.search);
const ventaId = params.get("id");

let formaPago = null;

// API en producción
const API = "https://contaemprende-production-eb68.up.railway.app";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (!ventaId) return showMessage("No se especificó ID de venta.", true);

  await cargarVenta();
  adaptarFormulario();
  setupBotones();
}

/* =======================
   Mostrar mensajes
======================= */
function showMessage(msg, error = false) {
  const el = document.getElementById("mensaje");
  el.textContent = msg;
  el.className = error ? "mensaje error" : "mensaje success";
  el.style.display = "block";
  
  setTimeout(() => {
    el.style.display = "none";
  }, 5000);
}

/* =======================
   Cargar venta - DISEÑO LIMPIO
======================= */
async function cargarVenta() {
  const infoContent = document.querySelector("#infoVenta .info-content");
  
  try {
    const res = await fetch(`${API}/api/ventas/detalle/${ventaId}`);
    if (!res.ok) throw new Error("Error al cargar venta");

    const json = await res.json();
    const v = json.venta ?? json.data ?? json;

    formaPago = v.forma_pago ?? v.formaPago ?? null;
    document.getElementById("metodoPago").value = formaPago === 'CAJA_CHICA' ? 'Caja Chica' : 'Banco';

    const detalles = v.detalles ?? [];

    // HTML simple y limpio
    infoContent.innerHTML = `
        <div class="compra-info-simple">
            <div class="info-row">
                <label>Cliente:</label>
                <span class="value">${v.cliente?.nombre ?? 'Sin cliente'}</span>
            </div>

            <div class="info-row">
                <label>N° Factura:</label>
                <span class="value">${v.num_factura ?? '---'}</span>
            </div>

            <div class="info-row">
                <label>N° Autorización:</label>
                <span class="value">${v.num_autorizacion ?? '---'}</span>
            </div>

            <div class="info-row">
                <label>Fecha:</label>
                <span class="value">${new Date(v.fecha ?? v.fecha_emision).toLocaleDateString()}</span>
            </div>

            <div class="info-row highlight">
                <label>Forma de pago registrada:</label>
                <span class="value">${formaPago === 'CAJA_CHICA' ? 'Caja Chica' : 'Banco'}</span>
            </div>
        </div>

        ${detalles.length > 0 ? `
        <div class="productos-simple">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalles.map(d => `
                        <tr>
                            <td>${d.producto?.nombre ?? d.nombre ?? 'Producto'}</td>
                            <td>${d.cantidad}</td>
                            <td>$${Number(d.precio_unit ?? d.precio_unitario).toFixed(2)}</td>
                            <td>$${Number(d.subtotal).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : '<p style="text-align:center; padding:20px; color:#718096;">No hay productos</p>'}

        <div class="totales-simple">
            <div class="total-simple">
                <span>Subtotal:</span>
                <span class="value">$${Number(v.base).toFixed(2)}</span>
            </div>
            <div class="total-simple">
                <span>IVA:</span>
                <span class="value">$${Number(v.iva).toFixed(2)}</span>
            </div>
            <div class="total-simple final">
                <span>Total a cobrar:</span>
                <span class="value" id="totalCobrar">$${Number(v.total).toFixed(2)}</span>
            </div>
        </div>
    `;
  } catch (err) {
    console.error(err);
    infoContent.innerHTML = `<p style="color:red; text-align:center; padding:40px;">Error al cargar la venta</p>`;
  }
}

/* =======================
   Adaptar UI según forma de pago
======================= */
function adaptarFormulario() {
  const areaBanco = document.getElementById("areaBanco");
  if (formaPago === "BANCO") {
    areaBanco.style.display = "block";
  } else {
    areaBanco.style.display = "none";
  }
}

/* =======================
    BOTONES
======================= */
function setupBotones() {
  document.getElementById("btnCancelar").onclick = () => history.back();
  document.getElementById("btnCobrar").onclick = cobrarVenta;
}

/* =======================
      GUARDAR COBRO
======================= */
async function cobrarVenta() {
  const permitirNegativo = document.getElementById("permitirNegativo").checked;
  const saldo = Number(document.getElementById("saldoManual").value);

  if (!saldo && !permitirNegativo)
    return showMessage("Ingrese saldo o permita negativo", true);

  let cuenta = null;

  if (formaPago === "BANCO") {
    const bancoNombre = document.getElementById("bancoNombre").value.trim();
    const tipoCuenta = document.getElementById("bancoTipoCuenta").value;
    const numeroCuenta = document.getElementById("numeroCuenta").value.trim();

    if (!bancoNombre || !numeroCuenta)
      return showMessage("Complete todos los datos del banco", true);

    cuenta = {
      nombre: bancoNombre,
      tipo: "BANCO",
      saldo: saldo,
      bancoTipo: tipoCuenta
    };
  } else {
    cuenta = {
      nombre: "Caja Chica",
      tipo: "CAJA_CHICA",
      saldo: saldo
    };
  }

  const payload = {
    permitirSaldoNegativo: permitirNegativo,
    cuenta
  };

  try {
    const btnCobrar = document.getElementById("btnCobrar");
    btnCobrar.disabled = true;
    btnCobrar.innerHTML = '<span>Procesando...</span>';

    const res = await fetch(`${API}/api/ventas/${ventaId}/cobrar`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    
    if (!json.ok) {
      btnCobrar.disabled = false;
      btnCobrar.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Cobrar Ahora</span>
      `;
      return showMessage(`${json.msg || "Error procesando cobro"}`, true);
    }

    showMessage("Cobro registrado con éxito");
    setTimeout(() => location.href = `venta-detalle.html?id=${ventaId}`, 1500);

  } catch (e) {
    console.error(e);
    showMessage("Error al conectar con servidor", true);
    
    const btnCobrar = document.getElementById("btnCobrar");
    btnCobrar.disabled = false;
    btnCobrar.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>Cobrar Ahora</span>
    `;
  }
}