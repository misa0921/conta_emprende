/* ======================= 
     OBTENER ID DE COMPRA 
======================= */
const params = new URLSearchParams(window.location.search);
const compraId = params.get("id");

let formaPago = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (!compraId) return showMessage("No se especificó ID de compra.", true);

  await cargarCompra();
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
   Cargar compra - DISEÑO SIMPLE
======================= */
async function cargarCompra() {
  const infoContent = document.querySelector("#infoCompra .info-content");
  
  try {
  const API_URL = "https://contaemprende-production-eb68.up.railway.app";
  const res = await fetch(`${API_URL}/api/compras/detalle/${compraId}`);
    if (!res.ok) throw new Error("Error al cargar compra");

    const json = await res.json();
    const c = json.compra ?? json.data ?? json;

    formaPago = c.forma_pago ?? c.formaPago ?? null;
    document.getElementById("metodoPago").value = formaPago === 'CAJA_CHICA' ? 'Caja Chica' : 'Banco';

    const detalles = c.detalles ?? [];

    // HTML simple y limpio
    infoContent.innerHTML = `
        <div class="compra-info-simple">
            <div class="info-row">
                <label>Proveedor:</label>
                <span class="value">${c.proveedor?.nombre ?? 'Sin proveedor'}</span>
            </div>

            <div class="info-row">
                <label>N° Factura:</label>
                <span class="value">${c.num_factura ?? '---'}</span>
            </div>

            <div class="info-row">
                <label>N° Autorización:</label>
                <span class="value">${c.num_autorizacion ?? '---'}</span>
            </div>

            <div class="info-row">
                <label>Fecha:</label>
                <span class="value">${new Date(c.fecha ?? c.fecha_emision).toLocaleDateString()}</span>
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
                <span class="value">$${Number(c.base).toFixed(2)}</span>
            </div>
            <div class="total-simple">
                <span>IVA:</span>
                <span class="value">$${Number(c.iva).toFixed(2)}</span>
            </div>
            <div class="total-simple final">
                <span>Total a pagar:</span>
                <span class="value" id="totalPagar">$${Number(c.total).toFixed(2)}</span>
            </div>
        </div>
    `;
  } catch (err) {
    console.error(err);
    infoContent.innerHTML = `<p style="color:red; text-align:center; padding:40px;">Error al cargar la compra</p>`;
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
  document.getElementById("btnPagar").onclick = pagarCompra;
}

/* =======================
      GUARDAR PAGO
======================= */
async function pagarCompra() {
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
    usuarioId: 1,
    permitirSaldoNegativo: permitirNegativo,
    cuenta
  };

  try {
    const btnPagar = document.getElementById("btnPagar");
    btnPagar.disabled = true;
    btnPagar.innerHTML = '<span>Procesando...</span>';

  const res = await fetch(`http://localhost:3000/api/compras/${compraId}/pagar`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    
    if (!json.ok) {
      btnPagar.disabled = false;
      btnPagar.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Pagar Ahora</span>
      `;
      return showMessage(`${json.msg || "Error procesando pago"}`, true);
    }

    showMessage("Pago registrado con éxito");
    setTimeout(() => location.href = `compra-detalle.html?id=${compraId}`, 1500);

  } catch (e) {
    console.error(e);
    showMessage("Error al conectar con servidor", true);
    
    const btnPagar = document.getElementById("btnPagar");
    btnPagar.disabled = false;
    btnPagar.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>Pagar Ahora</span>
    `;
  }
}