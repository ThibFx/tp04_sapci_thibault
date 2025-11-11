module.exports = (app) => {
  const pollution = require("../controllers/pollution.controllers.js");

  const router = require("express").Router();

  router.get("/", pollution.findAll);
  router.get("/:id", pollution.findOne);
  router.post("/", pollution.create);
  router.put("/:id", pollution.update);
  router.delete("/:id", pollution.delete);

  app.use("/api/pollutions", router);
};
