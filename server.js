import express from "express";
import cors from "cors";
import router from "./src/routes/index.js";

const app = express();

app.use(express.json());
app.use(cors());

// Archivos estáticos (HTML, CSS, JS)
app.use(express.static("public"));

// Ruta principal → login
app.get("/", (req, res) => {
  res.sendFile("views/login.html", { root: "public" });
});

// API
app.use("/api", router);

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


console.log("Rutas cargadas:");
console.log(router.stack.map(r => r.route?.path));
