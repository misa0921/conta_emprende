// login.js
const API = "https://contaemprende-production-eb68.up.railway.app/api";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMsg");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Limpiar mensaje de error
        errorMsg.textContent = "";

        const correo = document.getElementById("correo").value.trim();
        const password = document.getElementById("password").value;

        if (!correo || !password) {
            errorMsg.textContent = "Ingrese correo y contraseña";
            return;
        }

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, password })
            });

            if (!res.ok) throw new Error("Error de conexión con el servidor");

            const data = await res.json();

            if (data.ok) {
                // Guardar que el usuario está logueado (puede ser reemplazado por un token JWT)
                localStorage.setItem("userLogged", "1");

                // Redirigir al dashboard
                window.location.href = "/views/dashboard.html";
            } else {
                errorMsg.textContent = data.msg || "Usuario o contraseña incorrectos";
            }
        } catch (err) {
            console.error(err);
            errorMsg.textContent = "Error al conectar con el servidor";
        }
    });
});
