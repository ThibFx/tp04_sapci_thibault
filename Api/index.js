const express = require("express");
const cors = require("cors");

const app  = express ();

var corsOptions = {
  origin: "*",
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  headers: 'Content-Type, Authorization',
  exposedHeaders:'Authorization'
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to CNAM application." });
});

const db = require("./models");
require("./routes")(app);

const ensureSchema = async () => {
  await db.sequelize.query(
    'ALTER TABLE "pollution" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT \'open\''
  );
  await db.sequelize.query(
    'UPDATE "pollution" SET "status" = \'open\' WHERE "status" IS NULL'
  );
  await db.sequelize.query(
    'ALTER TABLE "pollution" DROP CONSTRAINT IF EXISTS "pollution_type_pollution_check"'
  );
};

const start = async () => {
  try {
    await ensureSchema();
    await db.sequelize.sync();
    console.log("Synced db.");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (err) {
    console.log("Failed to sync db: " + err.message);
  }
};

start();
