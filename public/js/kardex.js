const API = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    
    document.getElementById("btnBuscar").addEventListener("click", buscarMovimientos);
    document.getElementById("btnExcel").addEventListener("click", exportarExcel);
    document.getElementById("btnLimpiar").addEventListener("click", limpiarFiltros);
    
    // Listener para cuando se selecciona un producto
    document.getElementById("productoId").addEventListener("change", (e) => {
        if (e.target.value) {
            cargarResumenProducto(e.target.value);
        } else {
            ocultarResumen();
        }
    });
});

/**
 * Cargar lista de productos en el selector
 */
async function cargarProductos() {
    try {
        const res = await fetch(`${API}/kardex/productos`);
        const json = await res.json();

        if (!json.ok) {
            console.error("Error cargando productos:", json.msg);
            return;
        }

        const select = document.getElementById("productoId");
        
        json.data.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = `${p.nombre} (Stock: ${p.stock})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando productos:", err);
        alert("Error al cargar la lista de productos");
    }
}

/**
 * Buscar movimientos según filtros
 */
async function buscarMovimientos() {
    try {
        const filtros = {
            productoId: document.getElementById("productoId").value,
            tipo: document.getElementById("tipo").value,
            desde: document.getElementById("desde").value,
            hasta: document.getElementById("hasta").value
        };

        const query = new URLSearchParams(filtros);
        const res = await fetch(`${API}/kardex?${query}`);
        const json = await res.json();

        if (!json.ok) {
            alert(`Error: ${json.msg}`);
            return;
        }

        renderTabla(json.data);
    } catch (err) {
        console.error("Error en búsqueda:", err);
        alert("Error al buscar movimientos");
    }
}

/**
 * Renderizar tabla de movimientos
 */
function renderTabla(datos) {
    const tbody = document.querySelector("#tablaKardex tbody");
    tbody.innerHTML = "";

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No se encontraron movimientos</td></tr>';
        return;
    }

    datos.forEach(m => {
        const tr = document.createElement("tr");
        
        const tipoClass = m.tipo === "ENTRADA" ? "tipo-entrada" : "tipo-salida";
        const referencia = m.referenciaTipo ? `${m.referenciaTipo} #${m.referenciaId}` : "N/A";

        tr.innerHTML = `
            <td>${m.id}</td>
            <td>${new Date(m.fecha).toLocaleDateString()}</td>
            <td>${m.producto.nombre}</td>
            <td class="${tipoClass}">${m.tipo}</td>
            <td>${m.cantidad}</td>
            <td>$${m.costo_unitario.toFixed(2)}</td>
            <td>$${m.costo_total.toFixed(2)}</td>
            <td>${m.stock_antes}</td>
            <td>${m.stock_despues}</td>
            <td>${referencia}</td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Cargar resumen de un producto específico
 */
async function cargarResumenProducto(productoId) {
    try {
        const res = await fetch(`${API}/kardex/resumen/${productoId}`);
        const json = await res.json();

        if (!json.ok) {
            console.error("Error cargando resumen:", json.msg);
            return;
        }

        const { producto, resumen } = json.data;

        // Mostrar resumen
        document.getElementById("resumenProducto").style.display = "block";
        document.getElementById("resumenNombre").textContent = producto.nombre;
        document.getElementById("resumenStock").textContent = resumen.stock_actual;
        document.getElementById("resumenEntradas").textContent = resumen.total_entradas;
        document.getElementById("resumenSalidas").textContent = resumen.total_salidas;

    } catch (err) {
        console.error("Error cargando resumen:", err);
    }
}

/**
 * Ocultar resumen del producto
 */
function ocultarResumen() {
    document.getElementById("resumenProducto").style.display = "none";
}

/**
 * Exportar a Excel
 */
function exportarExcel() {
    const filtros = {
        productoId: document.getElementById("productoId").value,
        tipo: document.getElementById("tipo").value,
        desde: document.getElementById("desde").value,
        hasta: document.getElementById("hasta").value
    };

    const query = new URLSearchParams(filtros);
    window.location.href = `${API}/kardex/excel?${query}`;
}

/**
 * Limpiar todos los filtros
 */
function limpiarFiltros() {
    document.getElementById("productoId").value = "";
    document.getElementById("tipo").value = "";
    document.getElementById("desde").value = "";
    document.getElementById("hasta").value = "";
    
    ocultarResumen();
    
    // Limpiar tabla
    const tbody = document.querySelector("#tablaKardex tbody");
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Seleccione filtros y presione "Buscar"</td></tr>';
}