document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = document.getElementById("correo").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, password })
  });

  const data = await res.json();

  if (data.ok) {
    localStorage.setItem("userLogged", "1");
    window.location.href = "/views/dashboard.html";
  } else {
    document.getElementById("errorMsg").textContent = data.msg;
  }
});
