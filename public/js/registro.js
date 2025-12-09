
const API = "https://contaemprende-production-eb68.up.railway.app";

const tipoSelect = document.getElementById("tipoPersona");
const campoSexo = document.getElementById("campo-sexo");

// Ocultar sexo cuando selecciona proveedor (MEJORADO CON ANIMACIÓN)
if (tipoSelect && campoSexo) {
    tipoSelect.addEventListener("change", () => {
        if (tipoSelect.value === "PROVEEDOR") {
            campoSexo.style.maxHeight = "0";
            campoSexo.style.opacity = "0";
            campoSexo.style.marginBottom = "0";
            campoSexo.style.transform = "translateY(-10px)";
            setTimeout(() => {
                campoSexo.style.display = "none";
            }, 400);
        } else {
            campoSexo.style.display = "block";
            setTimeout(() => {
                campoSexo.style.maxHeight = "80px";
                campoSexo.style.opacity = "1";
                campoSexo.style.marginBottom = "25px";
                campoSexo.style.transform = "translateY(0)";
            }, 50);
        }
    });
}


// === REGISTRAR PERSONA ===
document.getElementById("btnRegistrar").addEventListener("click", async () => {

    const cedula = document.getElementById("cedula").value;
    const nombre = document.getElementById("nombre").value;
    const sexo = document.getElementById("sexo").value;
    const celular = document.getElementById("celular").value;
    const correo = document.getElementById("correo").value;
    const tipo = document.getElementById("tipoPersona").value;

    const msg = document.getElementById("msg");

    // Validar campos obligatorios
    if (!cedula || !nombre) {
        msg.className = "msg error";
        msg.innerText = "Por favor completa todos los campos obligatorios (Cédula y Nombre)";
        return;
    }

    try {
        const res = await fetch(`${API}/personas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cedula, nombre, sexo, celular, correo, tipo })
        });


        const data = await res.json();

        if (data.ok) {
            msg.className = "msg success";
            msg.innerText = "se registro correctamente";
            
        setTimeout(() => {
            document.getElementById("registroForm").reset();
            msg.innerText = "";           // Limpia contenido pero NO lo borra visualmente
            msg.className = "msg fade";   // Le bajamos presencia suavemente
        }, 3000);

        } else {
            msg.className = "msg error";
            msg.innerText = (data.msg || "Error al registrar");
        }
    } catch (error) {
        msg.className = "msg error";
        msg.innerText = "Error de conexión. Por favor intenta nuevamente";
    }

});