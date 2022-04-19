"use strict";

const db = require("../db");
const { UnauthorizedError } = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const Router = require("express").Router;
const router = new Router();

// app.use(authenticateJWT);

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res){
  const { username, password } = req.body;
  const result = await db.query(
    `SELECT password
      FROM users
      WHERE username = $1`,
      [username]);
  const user = result.rows[0];

  if (user) {
    if (await bcrypt.compare(password, user.password) === true) {
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token });
    }
  }
  throw new UnauthorizedError("Invalid user/password");
})


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res){
  const user = await User.register(req.body);
  const token = jwt.sign({ username: req.body.username }, SECRET_KEY);
  return res.json({ token });
})

module.exports = router;