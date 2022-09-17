const express = require("express");
const { MongoClient } = require('mongodb');
const dotenv = require("dotenv");
const app = express();

dotenv.config({path: './config.env' });

const DB = process.env.DATABASE;
const port = process.env.PORT;
const client = new MongoClient(DB);

const User = require("../models/user");

async function isUserExists(id) {
    try {
        const userExists = await client.db("telegram-bot").collection("users").findOne({id: id.toString()});
        console.log("U", userExists);
        if(userExists) {
            return 1;
        } else {
            return 0;
        }
    } catch (e) {
        console.error(e);
        return -1;
    }
}

async function InsertUser(id, name, sch, sec) {
    // Extra Info
    try {
        const user = new User({id: id, name: name, sch: sch, sec: sec});
        const res = await client.db("telegram-bot").collection("users").insertOne(user);
        console.log("I", res);
        return 1;
    } catch (e) {
        console.error(e);
        return -1;
    }
}


async function main(){
    try {
        await client.connect();
        isUserExists(633780289).then((res) => {
            console.log(res);
        })
        console.log("Connection Successful");
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error);

app.listen(port,  () => {
    console.log(`Server started on port ${port}`);
});