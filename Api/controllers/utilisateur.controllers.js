const db = require("../models");
const Utilisateurs = db.utilisateurs;

const buildUserPayload = (data = {}) => {
  const payload = {
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    login: data.login,
    password: data.password,
  };

  Object.keys(payload).forEach(
    (key) => payload[key] === undefined && delete payload[key]
  );

  return payload;
};

const toPublicUser = (user) => {
  const data = user?.toJSON ? user.toJSON() : user;
  if (!data) {
    return null;
  }
  delete data.password;
  return data;
};

exports.create = async (req, res) => {
  const { nom, prenom, login, password, email } = req.body || {};

  if (!nom || !prenom || !login || !password || !email) {
    return res
      .status(400)
      .send({ message: "nom, prenom, email, login et password sont requis." });
  }

  try {
    const user = await Utilisateurs.create(buildUserPayload(req.body));
    res.status(201).send(toPublicUser(user));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .send({ message: "Le login ou l'email est déjà utilisé." });
    }

    res.status(500).send({
      message: error.message || "Impossible de créer l'utilisateur.",
    });
  }
};

exports.findAll = async (_req, res) => {
  try {
    const utilisateurs = await Utilisateurs.findAll();
    res.send(utilisateurs.map(toPublicUser));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la récupération des utilisateurs.",
    });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Utilisateurs.destroy({ where: { id } });
    if (!deleted) {
      return res
        .status(404)
        .send({ message: `Utilisateur avec id=${id} introuvable.` });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de la suppression de l'utilisateur.",
    });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body || {};

  if (!login || !password) {
    return res
      .status(400)
      .send({ message: "Le login et le mot de passe sont obligatoires." });
  }

  try {
    const user = await Utilisateurs.findOne({ where: { login } });
    if (!user || user.password !== password) {
      return res.status(401).send({ message: "Identifiants invalides." });
    }

    res.send(toPublicUser(user));
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur lors de l'authentification.",
    });
  }
};
