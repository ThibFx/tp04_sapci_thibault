module.exports = (sequelize, Sequelize) => {
  const Pollution = sequelize.define(
    "pollution",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      nom: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "titre",
      },
      lieu: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateObservation: {
        type: Sequelize.DATE,
        allowNull: true,
        field: "date_observation",
      },
      typePollution: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "type_pollution",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "open",
        field: "status",
      },
      latitude: {
        // stocke les coordonnées GPS avec 6 décimales
        type: Sequelize.DECIMAL(9, 6),
      },
      longitude: {
        type: Sequelize.DECIMAL(9, 6),
      },
      imageUrl: {
        type: Sequelize.STRING,
        field: "photo_url",
      },
    },
    {
      timestamps: false,
      tableName: "pollution",
    }
  );

  return Pollution;
};
