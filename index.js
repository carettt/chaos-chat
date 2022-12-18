const express = require("express");
const { readFileSync, writeFileSync } = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3000;

const forbidden = ["new"];

function openDB() {
  const data = readFileSync("db.json", "utf-8");

  return JSON.parse(data);
}

function newGroup(chatName, members) {
  const groupData = { chatName: chatName, members: members, messages: [] };
  const groupUUID = uuidv4();

  let db = openDB();

  db.groups[groupUUID] = groupData;

  writeFileSync("db.json", JSON.stringify(db));

  return groupUUID;
}

function newUser(username, displayName) {
  const userData = { displayName: displayName, contacts: [] };

  let db = openDB();

  if (!db.users[username] && !forbidden.includes(username)) {
    db.users[username] = userData;
    writeFileSync("db.json", JSON.stringify(db));
  } else {
    return false;
  }

  return true;
}

function userRoutes() {
  let db = openDB();

  Object.keys(db.users).forEach((username) => {
    app.get("/users/" + username, (req, res) => {
      res.status(200).send(JSON.stringify(db.users[username]));
    });

    app.post("/users/" + username + "/new/contact", (req, res) => {
      res.append("Content-Type", "application/javascript; charset=UTF-8");
      res.append("Connection", "keep-alive");

      db.users[username].contacts.push(req.body.contact);
      writeFileSync("db.json", JSON.stringify(db));

      res.status(200).send(JSON.stringify(db.users[username].contacts));
    });
  });
}

function groupRoutes() {
  let db = openDB();
  let dbKeys = Object.keys(db.groups);

  dbKeys.forEach((guuid) => {
    app.get("/groups/" + guuid, (req, res) => {
      res.status(200).send(JSON.stringify(db.groups[guuid]));
    });

    app.post("/groups/" + guuid + "/new/message", (req, res) => {
      db.groups[guuid].messages.push(req.body);
      writeFileSync("db.json", JSON.stringify(db));
      res.status(200).send(JSON.stringify(db.groups[guuid]));
    });

    app.post("/groups/" + guuid + "/new/member", (req, res) => {
      if (!db.groups[guuid].members.includes(req.body.member)) {
        db.groups[guuid].members.push(req.body.member);
        writeFileSync("db.json", JSON.stringify(db));
        res.status(200).send(JSON.stringify({ succeeded: true }));
      } else {
        res.status(200).send(JSON.stringify({ succeeded: false }));
      }
    });
  });
}

app.use(express.json());

app.post("/users/new", (req, res) => {
  console.log(req.body);

  res.status(200).send(
    JSON.stringify({
      succeeded: newUser(req.body.username, req.body.displayName),
    })
  );
});

app.post("/groups/new", (req, res) => {
  res
    .status(200)
    .send(
      JSON.stringify({ guuid: newGroup(req.body.chatName, req.body.members) })
    );
});

userRoutes();
groupRoutes();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
