const API = "https://contaemprende-production-eb68.up.railway.app/api";

document.addEventListener("DOMContentLoaded", cargarInventario);

async function cargarInventario() {
    try {
        const res = await fetch(`${API}/productos`);
        let json = await res.json();

        // Si la API devuelve {ok, data}, usamos json.data
        let productos = json.data ?? json;

        // Actualizar estadísticas
        actualizarEstadisticas(productos);

        // Renderizar tabla
        const tbody = document.querySelector("#tablaInventario tbody");
        tbody.innerHTML = "";  // limpiar solo el cuerpo

        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 40px;">
                        No hay productos registrados
                    </td>
                </tr>
            `;
            return;
        }

        productos.forEach(prod => {
            const fila = document.createElement("tr");

            // Determinar clase de estado según stock
            let estadoClass = "estado-disponible";
            let estadoTexto = "Disponible";

            if (prod.stock === 0) {
                estadoClass = "estado-agotado";
                estadoTexto = "Agotado";
            } else if (prod.stock <= 5) {
                estadoClass = "estado-bajo";
                estadoTexto = "Bajo Stock";
            }

            // Estado del producto (EN_USO / DANADO)
            if (prod.estado === "DANADO") {
                estadoClass = "estado-danado";
                estadoTexto = "Dañado";
            }

            fila.innerHTML = `
                <td>${prod.id}</td>
                <td><strong>${prod.nombre}</strong></td>
                <td>${prod.descripcion ?? "Sin descripción"}</td>
                <td class="stock-cell">${prod.stock}</td>
                <td><span class="estado-badge ${estadoClass}">${estadoTexto}</span></td>
                <td>$${Number(prod.precio_compra).toFixed(2)}</td>
                <td>$${Number(prod.precio_venta).toFixed(2)}</td>
                <td>${prod.proveedor?.nombre ?? "Sin proveedor"}</td>
                <td class="acciones">
                    <button class="btn-edit" onclick="editarProducto(${prod.id})" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="eliminarProducto(${prod.id})" title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </td>
            `;

            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error("❌ Error obteniendo productos", error);
        alert("Error al cargar el inventario");
    }
}

/**
 * Actualizar estadísticas del inventario
 */
function actualizarEstadisticas(productos) {
    // Total de productos
    const totalProductos = productos.length;
    document.getElementById("totalProductos").textContent = totalProductos;

    // Productos disponibles (stock > 0 y estado EN_USO)
    const disponibles = productos.filter(
        p => p.stock > 0 && p.estado === "EN_USO"
    ).length;
    document.getElementById("disponibles").textContent = disponibles;

    // Productos con bajo stock (stock <= 5)
    const STOCK_MINIMO = 5;
    const bajoStock = productos.filter(
        p => p.stock <= STOCK_MINIMO && p.stock > 0
    ).length;
    document.getElementById("bajoStock").textContent = bajoStock;
}

function editarProducto(id) {
    window.location.href = `producto.html?id=${id}`;
}

async function eliminarProducto(id) {
    if (!confirm("¿Seguro desea eliminar este producto?")) return;

    try {
        const res = await fetch(`${API}/productos/${id}`, {
            method: "DELETE",
        });

        const json = await res.json();

        alert(json.msg || "Producto eliminado correctamente");
        cargarInventario(); // Recargar tabla

    } catch (error) {
        console.error("❌ Error eliminando producto", error);
        alert("Error al eliminar el producto");
    }
}

/**
 * Generar reporte PDF del inventario
 * ⚠️ CORREGIDA: Ahora con mejor manejo de errores y feedback
 */
async function generarPDF() {
    try {
        console.log("🔄 Generando PDF...");
        
        // Hacer petición al backend
        const res = await fetch(`${API}/productos/pdf`);
        
        // Verificar si la respuesta es exitosa
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
        }
        
        // Obtener el blob del PDF
        const blob = await res.blob();
        
        // Verificar que sea un PDF
        if (blob.type !== 'application/pdf') {
            throw new Error('La respuesta no es un PDF válido');
        }
        
        // Crear URL temporal y descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Agregar al DOM, hacer clic y limpiar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Liberar URL temporal
        window.URL.revokeObjectURL(url);
        
        console.log("✅ PDF generado exitosamente");
        alert("✅ PDF generado exitosamente");
        
    } catch (error) {
        console.error("❌ Error generando PDF:", error);
        alert(`❌ Error al generar el PDF:\n${error.message}\n\nVerifica que el servidor esté funcionando correctamente.`);
    }
}