const API = "https://contaemprende-production-eb68.up.railway.app/api";

// Proteger dashboard (si no está loggeado lo saca)
if (!localStorage.getItem("userLogged")) {
    window.location.href = "/views/login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await cargarEstadisticas();
    
    // Listener para logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("userLogged");
        window.location.href = "/views/login.html";
    });
});

/**
 * Cargar todas las estadísticas del dashboard
 */
async function cargarEstadisticas() {
    try {
        // Cargar en paralelo todas las estadísticas
        const [ventas, productos, personas, crecimiento, compras, cuentas] = await Promise.all([
            obtenerVentasDelMes(),
            obtenerProductos(),
            obtenerPersonas(),
            calcularCrecimiento(),
            obtenerCompras(),
            obtenerCuentas()
        ]);

        // Actualizar estadísticas superiores
        actualizarEstadisticasSuperiores(ventas, productos, personas, crecimiento);

        // Actualizar badges de los módulos
        actualizarBadgesModulos(ventas, productos, personas, compras, cuentas);

    } catch (err) {
        console.error("Error cargando estadísticas:", err);
    }
}

/**
 * Calcular crecimiento de ventas (mes actual vs mes anterior)
 */
async function calcularCrecimiento() {
    try {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        // Ventas del mes actual
        const resActual = await fetch(`${API}/ventas/reporte/${year}/${month}`);
        const jsonActual = await resActual.json();
        const ventasActuales = jsonActual.ventas || [];
        const totalActual = ventasActuales.reduce((sum, v) => sum + Number(v.total), 0);

        // Ventas del mes anterior
        let yearAnterior = year;
        let monthAnterior = month - 1;
        
        if (monthAnterior === 0) {
            monthAnterior = 12;
            yearAnterior = year - 1;
        }

        const resAnterior = await fetch(`${API}/ventas/reporte/${yearAnterior}/${monthAnterior}`);
        const jsonAnterior = await resAnterior.json();
        const ventasAnteriores = jsonAnterior.ventas || [];
        const totalAnterior = ventasAnteriores.reduce((sum, v) => sum + Number(v.total), 0);

        // Calcular porcentaje de crecimiento
        if (totalAnterior === 0) {
            return totalActual > 0 ? 100 : 0;
        }

        const crecimiento = ((totalActual - totalAnterior) / totalAnterior) * 100;
        return crecimiento;

    } catch (err) {
        console.error("Error calculando crecimiento:", err);
        return 0;
    }
}

/**
 * Obtener ventas del mes actual
 */
async function obtenerVentasDelMes() {
    try {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        const res = await fetch(`${API}/ventas/reporte/${year}/${month}`);
        const json = await res.json();

        if (json.ok) {
            return json.ventas || [];
        }
        return [];
    } catch (err) {
        console.error("Error obteniendo ventas:", err);
        return [];
    }
}

/**
 * Obtener todas las compras
 */
async function obtenerCompras() {
    try {
        const res = await fetch(`${API}/compras`);
        const json = await res.json();

        if (json.ok) {
            // El endpoint devuelve "compras" no "data"
            return json.compras || json.data || [];
        }
        return [];
    } catch (err) {
        console.error("Error obteniendo compras:", err);
        return [];
    }
}

/**
 * Obtener todas las cuentas bancarias
 */
async function obtenerCuentas() {
    try {
        const res = await fetch(`${API}/cuentas`);
        const json = await res.json();

        if (json.ok) {
            // El endpoint devuelve "cuentas" no "data"
            return json.cuentas || json.data || [];
        }
        return [];
    } catch (err) {
        console.error("Error obteniendo cuentas:", err);
        return [];
    }
}

/**
 * Obtener productos
 */
async function obtenerProductos() {
    try {
        const res = await fetch(`${API}/productos`);
        const json = await res.json();

        if (json.ok) {
            return json.data || [];
        }
        return [];
    } catch (err) {
        console.error("Error obteniendo productos:", err);
        return [];
    }
}

/**
 * Obtener personas (clientes y proveedores)
 */
async function obtenerPersonas() {
    try {
        const res = await fetch(`${API}/personas`);
        const json = await res.json();

        if (json.ok) {
            return json.data || [];
        }
        return [];
    } catch (err) {
        console.error("Error obteniendo personas:", err);
        return [];
    }
}

/**
 * Actualizar estadísticas superiores (cards de stats)
 */
function actualizarEstadisticasSuperiores(ventas, productos, personas, crecimiento) {
    // Total de ventas del mes
    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const statValues = document.querySelectorAll(".stat-value");
    
    if (statValues[0]) {
        statValues[0].textContent = `$${totalVentas.toFixed(2)}`;
    }

    // Total de transacciones (ventas)
    if (statValues[1]) {
        statValues[1].textContent = ventas.length;
    }

    // Clientes activos
    const clientesActivos = personas.filter(p => p.tipo === "CLIENTE").length;
    if (statValues[2]) {
        statValues[2].textContent = clientesActivos;
    }

    // Crecimiento con símbolo + o -
    if (statValues[3]) {
        const signo = crecimiento >= 0 ? "+" : "";
        statValues[3].textContent = `${signo}${crecimiento.toFixed(1)}%`;
        
        // Cambiar color según si creció o decreció
        const statCard = statValues[3].closest('.stat-card');
        if (statCard) {
            const statIcon = statCard.querySelector('.stat-icon');
            if (statIcon) {
                if (crecimiento >= 0) {
                    statIcon.style.background = 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)';
                } else {
                    statIcon.style.background = 'linear-gradient(135deg, #e53935 0%, #ef5350 100%)';
                }
            }
        }
    }
}

/**
 * Actualizar badges de los módulos
 */
function actualizarBadgesModulos(ventas, productos, personas, compras, cuentas) {
    const badges = document.querySelectorAll(".badge");

    // Badge de Compras (índice 0)
    if (badges[0]) {
        badges[0].textContent = `${compras.length} registros`;
    }

    // Badge de Ventas (índice 1)
    if (badges[1]) {
        badges[1].textContent = `${ventas.length} registros`;
    }

    // Badge de Inventario (índice 2)
    if (badges[2]) {
        badges[2].textContent = `${productos.length} productos`;
    }

    // Badge de Saldos Bancarios (índice 3)
    if (badges[3]) {
        badges[3].textContent = `${cuentas.length} cuentas`;
    }

    // Badge de Registro de Usuarios (índice 4)
    const totalPersonas = personas.length;
    if (badges[4]) {
        badges[4].textContent = `${totalPersonas} personas`;
    }

    // Badge de Reportes (índice 5) - deja "Ver todos"
}