// ===============================
// CARGAR PROVEEDORES
// ===============================
const API = "https://contaemprende-production-eb68.up.railway.app";

async function cargarProveedores(seleccionado = null) {
    try {
        const res = await fetch(`${API}/personas/proveedores`);
        const data = await res.json();

        const select = document.getElementById("proveedor");
        select.innerHTML = `<option value="">Seleccione un proveedor...</option>`;

        data.data.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.nombre;

            if (seleccionado && seleccionado == p.id) option.selected = true;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando proveedores:", error);
    }
}


// ===============================
// SI HAY ID → MODO EDICIÓN
// ===============================
const params = new URLSearchParams(window.location.search);
const idEditar = params.get("id");

if (idEditar) {
    cargarProductoParaEditar(idEditar);
} else {
    cargarProveedores();
}

async function cargarProductoParaEditar(id) {
    try {
        const res = await fetch(`${API}/productos/${id}`);
        const json = await res.json();

        if (!json.ok) return;

        const p = json.data;

        document.getElementById("nombre").value = p.nombre;
        document.getElementById("descripcion").value = p.descripcion ?? "";
        document.getElementById("precio_compra").value = p.precio_compra;
        document.getElementById("precio_venta").value = p.precio_venta;
        document.getElementById("stock").value = p.stock;
        document.getElementById("estado").value = p.estado;

        await cargarProveedores(p.proveedorId);

    } catch (error) {
        console.error("Error cargando producto:", error);
    }
}


// ===============================
// REGISTRAR / ACTUALIZAR PRODUCTO
// ===============================
document.getElementById("productoForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        precio_compra: document.getElementById("precio_compra").value,
        precio_venta: document.getElementById("precio_venta").value,
        stock: document.getElementById("stock").value,
        estado: document.getElementById("estado").value,
        proveedorId: document.getElementById("proveedor").value
    };

    const url = idEditar ? `${API}/productos/${idEditar}` : `${API}/productos`;


    const metodo = idEditar ? "PUT" : "POST";

    const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const json = await res.json();

    const msg = document.getElementById("msg");

    if (json.ok) {
        msg.style.color = "green";
        msg.innerText = idEditar
            ? "Producto actualizado correctamente ✔"
            : "Producto registrado correctamente ✔";

        setTimeout(() => {
            window.location.href = "inventario.html";
        }, 1000);

    } else {
        msg.style.color = "red";
        msg.innerText = "Error: " + (json.msg || "Intente de nuevo");
    }
});
