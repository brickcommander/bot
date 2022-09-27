const { MongoClient, ConnectionCheckOutFailedEvent } = require("mongodb");

const User = require("../models/user");
const notes2 = require("../models/notes");
const placement = require("../models/placementData");

const DB = process.env.DATABASE;
const client = new MongoClient(DB);
const ADMIN = process.env.ADMIN; // ADMIN
const admin = [ADMIN];

const subjects = [
  "Web Search and Mining",
  "TCP/IP",
  "Ethical Hacking",
  "Mobile Computing",
  "Network Security",
  "Distributed Computing",
];

const offers = ["6M", "FTE", "6M+FTE"];

async function isUserExists(id) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .findOne({ id: id.toString() });
    console.log("isUserExists", res, id);
    if (res) return 1;
    else return 0;
  } catch (e) {
    console.error(e);
    return -1;
  }
}

async function InsertUser(id, name, sch, sec) {
  try {
    let user = new User({
      id: id,
      name: name,
      sch: sch,
      sec: sec,
      [subjects[0]]: 0,
      [subjects[1]]: 0,
      [subjects[2]]: 0,
      [subjects[3]]: 0,
      [subjects[4]]: 0,
      [subjects[5]]: 0,
    });
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .insertOne(user);
    console.log("InsertUser", res);
  } catch (e) {
    console.error(e);
  }
}

async function getUser(id) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .findOne({ id: id });
    console.log("GetUser", res);
  } catch (e) {
    console.error(e);
  }
}

async function getAllUsers() {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .find({})
      .project({ id: 1, _id: 0 });
    res = await res.toArray();
    // console.log("GetUser", res);
    return res;
  } catch (e) {
    console.error(e);
  }
}

async function deleteUser(id) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .deleteOne({ id: id });
    console.log("DeleteUser", res);
  } catch (e) {
    console.error(e);
  }
}

async function InsertAdmin(id) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("admins")
      .insertOne({ id: id.toString() });
    console.log("InsertAdmins", res);
    admin.push(id);
  } catch (e) {
    console.error(e);
  }
}

async function getAllAdmins() {
  try {
    let res = await client.db("telegram-bot").collection("admins").find({});
    res = await res.toArray();
    res.forEach((element) => {
      admin.push(element.id);
    });
    console.log(admin);
  } catch (e) {
    console.error(e);
  }
}

async function InsertNotes(sub_name, topic, file_id) {
  try {
    let ex = await client
      .db("telegram-bot")
      .collection("Notes")
      .findOne({ SubjectName: sub_name, TopicName: topic });
    if (ex == null) {
      let newNote = new notes2({
        SubjectName: sub_name,
        TopicName: topic,
        FileID: file_id,
      });
      await client.db("telegram-bot").collection("Notes").insertOne(newNote);
      return 0;
    }
    let res = await client
      .db("telegram-bot")
      .collection("Notes")
      .updateOne(
        { SubjectName: sub_name, TopicName: topic },
        { $push: { FileID: file_id } }
      );
    console.log("InsertNotes", res);
    return 0;
  } catch (e) {
    console.error(e);
    return -1;
  }
}

async function DownloadNotes(sub_name, topic) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("Notes")
      .findOne({ SubjectName: sub_name, TopicName: topic });
    if (res == null) return 0;
    console.log("Downloaded Notes", res.FileID);
    return res.FileID;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function UpdateAttendanceinDB(id, subject) {
  try {
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .updateOne(
        { id: id.toString() },
        { $inc: { [subject]: 1 } },
        { upsert: true }
      );
    console.log("UpdateAttendanceinDB", res);
    if (res) return 0;
    else return 1;
  } catch (e) {
    console.error(e);
    return -1;
  }
}

async function getAttendancePercentage(id) {
  try {
    let tot = await client
      .db("telegram-bot")
      .collection("users")
      .findOne({ id: "9617466846", name: "TotalClasses" });
    console.log("Total Classes", tot);
    let res = await client
      .db("telegram-bot")
      .collection("users")
      .findOne({ id: id.toString() });
    console.log("getAttendancePercentage", res);
    let result = new Object();
    for (const i in res) {
      if (
        subjects.includes(i) &&
        Object.hasOwn(res, i) &&
        Object.hasOwn(tot, i)
      ) {
        if (tot[i] == 0) result[i] = 100;
        else result[i] = (res[i] * 100) / tot[i];
      }
    }
    console.log(result);
    return result;
  } catch (e) {
    console.error(e);
    return -1;
  }
}

async function UpdatePlacementData(obj) {
  try {
    console.log("Conn.js -> UpdatePlacementData", obj);
    let res = await client
      .db("telegram-bot")
      .collection("placementRecord")
      .updateOne({ scholar: obj.scholar }, { $set: obj }, { upsert: true });
    if (res) return 0;
    else return 1;
  } catch (e) {
    console.error(e);
    return -1;
  }
}

async function FindAllPlacementRecord(filterObj) {
  try {
    console.log("Conn.js -> FindAllPlacementRecord", filterObj);
    let res = await client
      .db("telegram-bot")
      .collection("placementRecord")
      .find(filterObj);
    res = await res.toArray();
    console.log("FindAllPlacementRecord", res.length);
    return res.length;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

async function errorLog(m) {
  await client
    .db("telegram-bot")
    .collection("error-logs")
    .insertOne({ message: m });
}

async function checkForUser(id) {
  id = id.toString();
  if (await admin.includes(id)) return 0;
  if ((await isUserExists(id)) == 0) {
    bot.telegram.sendMessage(id, "Please Login First");
    return 1;
  }
  return 0;
}

async function main() {
  try {
    await client.connect();
    console.log("Connection Successful");
    getAllAdmins();
  } catch (e) {
    console.error(e);
  }
}

module.exports = {
  client,
  admin,
  subjects,
  offers,
  isUserExists,
  InsertUser,
  getUser,
  deleteUser,
  InsertAdmin,
  getAllAdmins,
  InsertNotes,
  DownloadNotes,
  UpdateAttendanceinDB,
  getAttendancePercentage,
  UpdatePlacementData,
  FindAllPlacementRecord,
  errorLog,
  checkForUser,
  main,
  getAllUsers,
};
