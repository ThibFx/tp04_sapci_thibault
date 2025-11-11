const db = require("../models");
const Pollution = db.pollutions;

const ALLOWED_STATUSES = ["open", "investigating", "resolved"];
const TYPE_ALIASES = {
  plastic: "plastic",
  plastique: "plastic",
  plasticue: "plastic",
  chemical: "chemical",
  chimique: "chemical",
  chimical: "chemical",
  wild_dumping: "wild_dumping",
  depotsauvage: "wild_dumping",
  "dépôt sauvage": "wild_dumping",
  water: "water",
  eau: "water",
  air: "air",
  autre: "other",
  other: "other",
  pollution: "other",
};

const normalizeType = (value) => {
  if (!value || typeof value !== "string") {
    return "other";
  }
  const key = value.toLowerCase().trim().replace(/\s+/g, "_");
  return TYPE_ALIASES[key] || "other";
};

const buildPayload = (data = {}) => {
  const payload = {
    nom: data.nom ?? data.name,
    lieu: data.lieu ?? data.city,
    dateObservation: data.dateObservation ?? data.recordedAt,
    typePollution: normalizeType(data.typePollution ?? data.type),
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    imageUrl: data.imageUrl,
    status: data.status ?? data.etat ?? "open",
  };

  Object.keys(payload).forEach(
    (key) => payload[key] === undefined && delete payload[key]
  );

  if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
    payload.status = "open";
  }

  return payload;
};

const serialize = (entity) => {
  if (!entity) {
    return null;
  }
  const data = entity.toJSON ? entity.toJSON() : entity;
  const type = normalizeType(data.typePollution);
  return {
    id: data.id,
    nom: data.nom,
    name: data.nom,
    lieu: data.lieu,
    city: data.lieu,
    dateObservation: data.dateObservation,
    recordedAt: data.dateObservation,
    typePollution: type,
    type,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    imageUrl: data.imageUrl,
    status: data.status ?? "open",
  };
};

exports.create = async (req, res) => {
  const payload = buildPayload(req.body);

  if (!payload.nom) {
    return res.status(400).send({ message: "Le nom est obligatoire." });
  }
  if (!payload.lieu) {
    return res.status(400).send({ message: "Le lieu est obligatoire." });
  }
  if (!payload.typePollution) {
    return res.status(400).send({ message: "Le type de pollution est requis." });
  }
  if (!payload.dateObservation) {
    return res
      .status(400)
      .send({ message: "La date d'observation est requise." });
  }
  if (!payload.description) {
    return res
      .status(400)
      .send({ message: "La description de la pollution est requise." });
  }
  try {
    const pollution = await Pollution.create(payload);
    res.status(201).send(serialize(pollution));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Impossible de créer la pollution.",
    });
  }
};


exports.findAll = async (_req, res) => {
  try {
    const pollutions = await Pollution.findAll({
      order: [["dateObservation", "DESC"]],
    });
    res.send(pollutions.map(serialize));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la récupération des données.",
    });
  }
};


exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const pollution = await Pollution.findByPk(id);
    if (!pollution) {
      return res
        .status(404)
        .send({ message: `Pollution avec id=${id} introuvable.` });
    }
    res.send(serialize(pollution));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la récupération.",
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;

  try {
    const [updated] = await Pollution.update(buildPayload(req.body), {
      where: { id },
    });

    if (!updated) {
      return res
        .status(404)
        .send({ message: `Pollution avec id=${id} introuvable.` });
    }

    const pollution = await Pollution.findByPk(id);
    res.send(serialize(pollution));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la mise à jour.",
    });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Pollution.destroy({ where: { id } });
    if (!deleted) {
      return res
        .status(404)
        .send({ message: `Pollution avec id=${id} introuvable.` });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la suppression.",
    });
  }
};
