"use strict";

const User = require("../models/user");
const Message = require("../models/message");
const { ensureCorrectUser } = require("../middleware/auth");
const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureCorrectUser, async function (req,res){
  const id = req.params.id;
  const message = await Message.get(id);
  return res.json({message});
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureCorrectUser, async function(req,res){
  const { to_username, body } = req.body;
  const message = await Message.create({from_username: res.locals.user, to_username, body});
  return res.json ({message});
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureCorrectUser, async function(req,res){
  const id = req.params.id;
  const readMessage = await Message.markRead(id);
  return res.json ({message: readMessage})
} )

module.exports = router;
