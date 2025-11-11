module.exports = (app) => {
  const utilisateur = require("../controllers/utilisateur.controllers.js");

  const router = require("express").Router();

  router.post("/", utilisateur.create);
  router.get("/", utilisateur.findAll);
  router.delete("/:id", utilisateur.delete);
  router.post("/login", utilisateur.login);

  app.use("/api/users", router);
};
