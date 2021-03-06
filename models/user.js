"use strict";

/** User class for message.ly */

const db = require("../db");
const { UnauthorizedError } = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username,
                            password,
                            first_name,
                            last_name,
                            phone,
                            join_at,
                            last_login_at)
        VALUES
          ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (user) {
      return await bcrypt.compare(password, user.password);
    }
    throw new UnauthorizedError("Invalid user/password");
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const updatedLogin = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING last_login_at`,
      [username]
    );

    if (!updatedLogin) {
      throw new UnauthorizedError("Invalid user");
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const users = await db.query(
      `SELECT username,
              first_name,
              last_name
      FROM users
      `
    );

    return users.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const user = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    return user.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(
      `SELECT id,
              body,
              sent_at,
              read_at,
              to_username AS to_user,
              username,
              first_name,
              last_name,
              phone
      FROM messages
      JOIN users ON to_username = users.username
      WHERE from_username = $1
      `,
      [username]
    );

    const messages = messageResults.rows;

    let messagesFromUser = [];
    for (let message of messages) {
      const msg = {
        id: message.id,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
      };

      msg.to_user = {
        username: message.username,
        first_name: message.first_name,
        last_name: message.last_name,
        phone: message.phone,
      };

      messagesFromUser.push(msg);
    }
    return messagesFromUser;
  }
  // ALTERNATIVE METHOD USING A MAP:
  //
  // let array = messages.map((message) => {
  //   const msg = {
  //     id: message.id,
  //     body: message.body,
  //     sent_at: message.sent_at,
  //     read_at: message.read_at,
  //   };

  //   msg.to_user = {
  //     username: message.username,
  //     first_name: message.first_name,
  //     last_name: message.last_name,
  //     phone: message.phone,
  //   };

  //   return msg;
  // });

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(
      `SELECT id,
              body,
              sent_at,
              read_at,
              from_username AS from_user,
              username,
              first_name,
              last_name,
              phone
      FROM messages
      JOIN users ON from_username = users.username
      WHERE to_username = $1
      `,
      [username]
    );

    const messages = messageResults.rows;

    let messagesToUser = [];
    for (let message of messages) {
      const msg = {
        id: message.id,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
      };

      msg.from_user = {
        username: message.username,
        first_name: message.first_name,
        last_name: message.last_name,
        phone: message.phone,
      };

      messagesToUser.push(msg);
    }
    return messagesToUser;
  }
}

module.exports = User;
