const API = "https://contaemprende-production-eb68.up.railway.app";
const urlParams = new URLSearchParams(window.location.search);
const ventaId = urlParams.get("id");

document.addEventListener("DOMContentLoaded", async () => {
    if (!ventaId) {
        alert("No se encontró la venta a cobrar.");
        window.location.href = "venta.html";
        return;
    }

    await cargarVenta();
    document.getElementById("btnCobrar").addEventListener("click", cobrarVenta);
    document.getElementById("btnCancelar").addEventListener("click", () => {
        window.location.href = "venta.html";
    });
});

async function cargarVenta() {
    try {
        const res = await fetch(`${API}/ventas/detalle/${ventaId}`);
        const json = await res.json();
        if (!json.ok) return alert("Error cargando venta");

        const venta = json.venta;

        const infoDiv = document.getElementById("infoVenta");
        infoDiv.innerHTML = ""; // Limpiar contenido previo

        // Cabecera de información
        const infoLista = document.createElement("ul");
        infoLista.style.listStyle = "none";
        infoLista.style.padding = "0";

        const datos = [
            ["Cliente", venta.cliente.nombre],
            ["Factura", venta.num_factura],
            ["Fecha", new Date(venta.fecha_emision).toLocaleDateString()],
            ["Total", `$${venta.total.toFixed(2)}`],
            ["Estado", venta.estado],
        ];

        datos.forEach(([label, valor]) => {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${label}:</strong> ${valor}`;
            infoLista.appendChild(li);
        });

        infoDiv.appendChild(infoLista);

        // Tabla de detalles
        if (venta.detalles && venta.detalles.length > 0) {
            const tabla = document.createElement("table");
            tabla.style.width = "100%";
            tabla.style.borderCollapse = "collapse";
            tabla.style.marginTop = "10px";

            // Cabecera
            const thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th style="border-bottom:1px solid #ccc; text-align:left;">Producto</th>
                    <th style="border-bottom:1px solid #ccc; text-align:right;">Cantidad</th>
                    <th style="border-bottom:1px solid #ccc; text-align:right;">Precio Unitario</th>
                    <th style="border-bottom:1px solid #ccc; text-align:right;">Subtotal</th>
                </tr>
            `;
            tabla.appendChild(thead);

            // Cuerpo
            const tbody = document.createElement("tbody");
            venta.detalles.forEach(d => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${d.producto.nombre}</td>
                    <td style="text-align:right;">${d.cantidad}</td>
                    <td style="text-align:right;">$${d.precio_unit.toFixed(2)}</td>
                    <td style="text-align:right;">$${d.subtotal.toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
            tabla.appendChild(tbody);

            infoDiv.appendChild(tabla);
        }

        // Forma de pago
        const metodoPago = document.getElementById("metodoPago");
        metodoPago.value = venta.forma_pago;

        // Muestra/oculta área de banco según forma de pago
        toggleBanco(venta.forma_pago);
        
        // Valor por defecto del saldo
        document.getElementById("saldoManual").value = 0;

    } catch (err) {
        console.error("Error cargando venta:", err);
        alert("Error al cargar la venta desde el servidor");
    }
}

function toggleBanco(formaPago) {
    document.getElementById("areaBanco").style.display = formaPago === "BANCO" ? "block" : "none";
}

async function cobrarVenta() {
    const metodo = document.getElementById("metodoPago").value;
    // ✅ Corregido: usar el id correcto del HTML
    const permitirSaldoNegativo = document.getElementById("permitirNegativo")?.checked || false;
    
    const body = {
        permitirSaldoNegativo
    };

    // ✅ Solo agregar cuenta si el método de pago es BANCO
    if (metodo === "BANCO") {
        const bancoNombre = document.getElementById("bancoNombre").value.trim();
        const bancoTipoCuenta = document.getElementById("bancoTipoCuenta").value;
        const numeroCuenta = document.getElementById("numeroCuenta").value.trim();
        const saldo = Number(document.getElementById("saldoManual").value) || 0;

        // Validaciones para BANCO
        if (!bancoNombre) {
            alert("Por favor ingrese el nombre del banco");
            return;
        }
        if (!numeroCuenta) {
            alert("Por favor ingrese el número de cuenta");
            return;
        }

        body.cuenta = {
            nombre: `${bancoNombre} - ${bancoTipoCuenta} - ${numeroCuenta}`,
            tipo: "BANCO",
            saldo: saldo
        };
    }
    // ✅ Si es CAJA_CHICA, no enviamos nada de cuenta (pago directo en efectivo)

    try {
        const res = await fetch(`${API}/ventas/${ventaId}/cobrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const json = await res.json();
        
        if (!json.ok) {
            alert(`❌ Error: ${json.msg}`);
            return;
        }

        console.log("Respuesta del servidor:", json);
        alert("✅ Venta cobrada exitosamente");
        window.location.href = "venta.html";
        
    } catch (err) {
        console.error("Error al cobrar la venta:", err);
        alert("❌ Error al procesar el cobro");
    }
}