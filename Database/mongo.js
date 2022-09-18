const express = require("express");
const { MongoClient } = require('mongodb');
const app = express();

const dotenv = require("dotenv");
dotenv.config({path: './config.env' });


const DB = process.env.DATABASE;
const port = process.env.PORT;
const client = new MongoClient(DB);

const User = require("../models/user");

const GOD = process.env.ADMIN; // ADMIN

const admin = [GOD];

async function isUserExists(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").findOne({id: id.toString()})
        console.log("isUserExists", res, id);
        if(res) return 1;
        else    return 0; 
    } catch (e) {
        console.error(e);
        return -1;
    }
}

async function InsertUser(id, name, sch, sec) {
    // Extra Info
    try {
        let user = new User({"id": id, "name": name, "sch": sch, "sec": sec});
        let res = await client.db("telegram-bot").collection("users").insertOne(user);
        console.log("InsertUser", res);
    } catch (e) {
        console.error(e);
    }
}

async function getUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").findOne({id: id});
        console.log("GetUser", res);
    } catch (e) {
        console.error(e);
    }
}

async function deleteUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").deleteOne({id: id});
        console.log("DeleteUser", res);
    } catch (e) {
        console.error(e);
    }
}

async function InsertAdmin(id) {
    try {
        let res = await client.db("telegram-bot").collection("admins").insertOne({id: id.toString()});
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
        res.forEach(element => {
            admin.push(element.id);
        });
        console.log(admin);
    } catch (e) {
        console.error(e);
    }
}

async function isAMember(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").findOne({id: id});
        console.log("GetUser", res);
        if(res) return 1;
        else    return 0;
    } catch (e) {
        console.error(e);
    }
}

async function main(){
    try {
        await client.connect();
        console.log("Connection Successful");
        getAllAdmins();
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error);

app.listen(port,  () => {
    console.log(`Server started on port ${port}`);
});

module.exports = {admin, isUserExists, getUser, deleteUser, InsertAdmin, getAllAdmins, isAMember}