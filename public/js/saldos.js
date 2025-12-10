const API = "https://contaemprende-production-eb68.up.railway.app/api";

const modal = document.getElementById('modal-movimientos');
const tablaMovimientos = document.querySelector('#tabla-movimientos tbody');

async function cargarSaldos() {
  try {
    const resCuentas = await fetch(`${API}/saldos`);
    
    if (!resCuentas.ok) {
      throw new Error(`Error HTTP: ${resCuentas.status}`);
    }
    
    const json = await resCuentas.json();
    const cuentas = Array.isArray(json) ? json : json.data ?? [];
    const container = document.getElementById('cuentas-container');

    // Calcular estadísticas
    let totalSaldos = 0;
    let saldoBancario = 0;
    let saldoCaja = 0;

    cuentas.forEach(c => {
      totalSaldos += c.saldo;
      if (c.tipo === 'BANCO') {
        saldoBancario += c.saldo;
      } else {
        saldoCaja += c.saldo;
      }
    });

    // Actualizar estadísticas en el header
    document.getElementById('totalSaldos').textContent = `$${totalSaldos.toFixed(2)}`;
    document.getElementById('totalCuentas').textContent = cuentas.length;
    document.getElementById('saldoBancario').textContent = `$${saldoBancario.toFixed(2)}`;
    document.getElementById('saldoCaja').textContent = `$${saldoCaja.toFixed(2)}`;

    // Renderizar tabla
    container.innerHTML = cuentas.map((c, index) => {
      // Mejorar nombre de la cuenta si es numérico
      let displayNombre = c.nombre;
      if (c.tipo === 'BANCO' && !isNaN(c.nombre)) {
        displayNombre = `Banco #${c.nombre}`;
      }

      const tipoBadgeClass = c.tipo === 'BANCO' ? 'tipo-banco' : 'tipo-caja';
      const saldoClass = c.tipo === 'BANCO' ? 'saldo-banco' : 'saldo-caja';

      return `
        <tr style="--row-index: ${index}">
          <td><strong>${displayNombre}</strong></td>
          <td>
            <span class="tipo-badge ${tipoBadgeClass}">
              ${c.tipo === 'BANCO' ? '🏦 BANCO' : '💰 CAJA CHICA'}
            </span>
          </td>
          <td>
            <span class="saldo-valor ${saldoClass}">
              $${c.saldo.toFixed(2)}
            </span>
          </td>
          <td>
            <button class="btn-movimientos" onclick="verMovimientos(${c.id}, '${displayNombre}', '$${c.saldo.toFixed(2)}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Ver Movimientos
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Error al cargar saldos:", error);
    const container = document.getElementById('cuentas-container');
    container.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #e53e3e;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 15px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p><strong>Error al cargar los saldos</strong></p>
          <p style="font-size: 14px; margin-top: 10px;">${error.message}</p>
        </td>
      </tr>
    `;
  }
}

async function verMovimientos(cuentaId, nombreCuenta, saldo) {
  try {
    console.log('📡 Cargando movimientos para cuenta:', cuentaId);
    
    // Actualizar información de la cuenta en el modal
    const cuentaInfo = document.getElementById('modalCuentaInfo');
    cuentaInfo.querySelector('.cuenta-nombre').textContent = nombreCuenta;
    cuentaInfo.querySelector('.cuenta-saldo').textContent = saldo;

    // Mostrar loading en la tabla de movimientos
    tablaMovimientos.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <span>Cargando movimientos...</span>
          </div>
        </td>
      </tr>
    `;

    // Mostrar modal
    modal.classList.add('active');

    // Cargar movimientos
    const res = await fetch(`${API}/saldos/movimientos/${cuentaId}`);
    
    console.log('📥 Response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const movimientos = await res.json();
    
    console.log('📦 Movimientos recibidos:', movimientos);
    console.log('📊 Total movimientos:', movimientos.length);

    // Limpiar tabla
    tablaMovimientos.innerHTML = '';

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      tablaMovimientos.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 15px;">
              <circle cx="12" cy="12" r="10"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p>No hay movimientos registrados</p>
          </td>
        </tr>
      `;
    } else {
      movimientos.forEach((m, index) => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const fecha = new Date(m.fecha).toLocaleDateString('es-EC', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // ✅ CORRECCIÓN: Usar el campo 'tipo' del backend en lugar de calcular por monto
        const tipoMovimiento = m.tipo || 'PAGO';
        
        // Determinar si es ingreso o egreso basado en el tipo
        const esIngreso = tipoMovimiento === 'INGRESO' || tipoMovimiento === 'COBRO';
        const colorMonto = esIngreso ? 'style="color: #38a169;"' : 'style="color: #e53e3e;"';
        
        // Formatear referencia
        let referencia = m.referencia || '-';
        if (m.compraId) {
          referencia = `Compra #${m.compraId}`;
        } else if (m.ventaId) {
          referencia = `Venta #${m.ventaId}`;
        }
        
        // Icono según tipo
        let tipoIcon = '💰';
        if (tipoMovimiento === 'INGRESO') tipoIcon = '⬆️';
        else if (tipoMovimiento === 'PAGO') tipoIcon = '⬇️';
        else if (tipoMovimiento === 'TRANSFERENCIA') tipoIcon = '🔄';
        
        row.innerHTML = `
          <td>
            <span style="color: #718096; font-size: 14px;">
              ${fecha}
            </span>
          </td>
          <td ${colorMonto}>
            <strong>$${parseFloat(m.monto).toFixed(2)}</strong>
          </td>
          <td>
            <span style="color: #4a5568;">
              ${referencia}
            </span>
          </td>
          <td>
            <span class="tipo-badge ${esIngreso ? 'tipo-caja' : 'tipo-banco'}" style="display: inline-flex; align-items: center; gap: 5px;">
              <span>${tipoIcon}</span>
              <span>${tipoMovimiento}</span>
            </span>
          </td>
        `;
        
        tablaMovimientos.appendChild(row);
        
        console.log(`✅ Movimiento ${index + 1}:`, {
          fecha: fecha,
          tipo: tipoMovimiento,
          monto: m.monto,
          referencia: referencia
        });
      });
      
      console.log('🎉 Movimientos renderizados correctamente');
    }

  } catch (error) {
    console.error("❌ Error al cargar movimientos:", error);
    tablaMovimientos.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #e53e3e;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 15px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p><strong>Error al cargar los movimientos</strong></p>
          <p style="font-size: 14px; margin-top: 10px;">${error.message}</p>
        </td>
      </tr>
    `;
  }
}

// Cerrar modal
function cerrarModal() {
  modal.classList.remove('active');
}

// Cerrar modal si se hace clic fuera del contenido
window.onclick = function(event) {
  if (event.target === modal) {
    modal.classList.remove('active');
  }
}

// Actualizar saldos
async function actualizarSaldos() {
  const btn = document.querySelector('.btn-refresh');
  btn.classList.add('loading');
  
  try {
    await cargarSaldos();
    
    // Mostrar mensaje de éxito
    setTimeout(() => {
      btn.classList.remove('loading');
      
      // Pequeña animación de confirmación
      const container = document.getElementById('cuentas-container');
      container.style.opacity = '0.5';
      setTimeout(() => {
        container.style.opacity = '1';
      }, 200);
    }, 800);
    
  } catch (error) {
    btn.classList.remove('loading');
    alert('Error al actualizar los saldos. Por favor, intenta nuevamente.');
  }
}

// Exportar movimientos a Excel
function exportarMovimientos() {
  const nombreCuenta = document.querySelector('.cuenta-nombre').textContent;
  const rows = tablaMovimientos.querySelectorAll('tr');
  
  if (rows.length === 0 || rows[0].querySelector('.empty-state')) {
    alert('No hay movimientos para exportar');
    return;
  }
  
  // Aquí implementarías la lógica real de exportación
  console.log('Exportando movimientos de:', nombreCuenta);
  alert(`Exportando movimientos de ${nombreCuenta} a Excel...`);
  
  // Ejemplo de implementación con una librería como xlsx:
  // const wb = XLSX.utils.book_new();
  // const ws = XLSX.utils.table_to_sheet(document.getElementById('tabla-movimientos'));
  // XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
  // XLSX.writeFile(wb, `movimientos_${nombreCuenta}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Imprimir movimientos
function imprimirMovimientos() {
  const nombreCuenta = document.querySelector('.cuenta-nombre').textContent;
  const saldo = document.querySelector('.cuenta-saldo').textContent;
  
  // Crear una ventana de impresión con estilos personalizados
  const printWindow = window.open('', '', 'height=600,width=800');
  
  printWindow.document.write('<html><head><title>Movimientos - ' + nombreCuenta + '</title>');
  printWindow.document.write(`
    <style>
      body { 
        font-family: Arial, sans-serif; 
        padding: 20px;
        color: #333;
      }
      h1 { 
        color: #38a169; 
        border-bottom: 3px solid #38a169;
        padding-bottom: 10px;
      }
      .info { 
        background: #f0fdf4; 
        padding: 15px; 
        border-radius: 8px; 
        margin: 20px 0;
        display: flex;
        justify-content: space-between;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 20px;
      }
      th { 
        background: #38a169; 
        color: white; 
        padding: 12px; 
        text-align: left;
      }
      td { 
        padding: 10px; 
        border-bottom: 1px solid #e2e8f0;
      }
      tr:hover { 
        background: #f7fafc; 
      }
      .fecha { color: #4a5568; }
      .positivo { color: #38a169; font-weight: bold; }
      .negativo { color: #e53e3e; font-weight: bold; }
      @media print {
        button { display: none; }
      }
    </style>
  `);
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h1>Movimientos - ' + nombreCuenta + '</h1>');
  printWindow.document.write('<div class="info">');
  printWindow.document.write('<span><strong>Cuenta:</strong> ' + nombreCuenta + '</span>');
  printWindow.document.write('<span><strong>Saldo:</strong> ' + saldo + '</span>');
  printWindow.document.write('</div>');
  printWindow.document.write(document.getElementById('tabla-movimientos').outerHTML);
  printWindow.document.write('</body></html>');
  
  printWindow.document.close();
  printWindow.print();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
  cargarSaldos();
  
  // Actualizar cada 5 minutos automáticamente
  setInterval(cargarSaldos, 300000);
});