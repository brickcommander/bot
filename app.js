const Telegraf = require('telegraf')
const dotenv = require("dotenv")

// const fs = require("fs")

const WizardScene = require("telegraf/scenes/wizard")
const Stage = require("telegraf/stage")
const session = require("telegraf/session")

dotenv.config({path: './config.env' })

const TOKEN = process.env.TOKEN
const bot = new Telegraf(TOKEN)
const ADMIN = process.env.ADMIN // ADMIN

const admin = [ADMIN]
const subjects = ["Web Search and Mining", "TCP/IP", "Ethical Hacking", "Mobile Computing", "Network Security", "Distributed Computing"]
const offers = ["6M", "FTE", "6M+FTE"]

bot.use(session())

/* ************************************ DATABASE QUERIES - START ****************************************** */

const express = require("express");
const { MongoClient, ConnectionCheckOutFailedEvent } = require('mongodb');
const app = express();

const DB = process.env.DATABASE;
const port = process.env.PORT;
const client = new MongoClient(DB);

const User = require("./models/user")
const notes2 = require("./models/notes")
const placement = require("./models/placementData")

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
    try {
        let user = new User({"id": id, "name": name, "sch": sch, "sec": sec, [subjects[0]]: 0, [subjects[1]]: 0, [subjects[2]]: 0, [subjects[3]]: 0, [subjects[4]]: 0, [subjects[5]]: 0})
        let res = await client.db("telegram-bot").collection("users").insertOne(user)
        console.log("InsertUser", res)
    } catch (e) {
        console.error(e)
    }
}

async function getUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").findOne({id: id})
        console.log("GetUser", res)
    } catch (e) {
        console.error(e)
    }
}

async function deleteUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").deleteOne({id: id})
        console.log("DeleteUser", res)
    } catch (e) {
        console.error(e)
    }
}

async function InsertAdmin(id) {
    try {
        let res = await client.db("telegram-bot").collection("admins").insertOne({id: id.toString()})
        console.log("InsertAdmins", res)
        admin.push(id)
    } catch (e) {
        console.error(e)
    }
}

async function getAllAdmins() {
    try {
        let res = await client.db("telegram-bot").collection("admins").find({})
        res = await res.toArray()
        res.forEach(element => {
            admin.push(element.id)
        });
        console.log(admin)
    } catch (e) {
        console.error(e)
    }
}

async function InsertNotes(sub_name, topic, file_id) {
    try {
        let ex = await client.db("telegram-bot").collection("Notes").findOne({"SubjectName": sub_name, "TopicName": topic})
        if(ex == null) {
            let newNote = new notes2({"SubjectName": sub_name, "TopicName": topic, "FileID": file_id})
            await client.db("telegram-bot").collection("Notes").insertOne(newNote)
            return 0
        }
        let res = await client.db("telegram-bot").collection("Notes").updateOne({"SubjectName": sub_name, "TopicName": topic}, { $push: {"FileID": file_id}})
        console.log("InsertNotes", res)
        return 0
    } catch(e) {
        console.error(e)
        return -1
    }
}

async function DownloadNotes(sub_name, topic) {
    try {
        let res = await client.db("telegram-bot").collection("Notes").findOne({"SubjectName": sub_name, "TopicName": topic})
        if(res == null) return 0
        console.log("Downloaded Notes", res.FileID)
        return res.FileID
    } catch(e) {
        console.error(e)
        return null
    }
}

async function UpdateAttendanceinDB(id, subject) {
    try {
        let res = await client.db("telegram-bot").collection("users").updateOne({"id": id.toString()}, {$inc: {[subject]: 1}}, {upsert: true})
        console.log("UpdateAttendanceinDB", res);
        if(res) return 0
        else    return 1
    } catch(e) {
        console.error(e)
        return -1
    }
}

async function getAttendancePercentage(id) {
    try {
        let tot = await client.db("telegram-bot").collection("users").findOne({"id": "9617466846", "name": "TotalClasses"})
        console.log("Total Classes", tot)
        let res = await client.db("telegram-bot").collection("users").findOne({"id": id.toString()})
        console.log("getAttendancePercentage", res)
        let result = new Object()
        for (const i in res) {
            if(subjects.includes(i) && Object.hasOwn(res, i) && Object.hasOwn(tot, i)) {
                if(tot[i] == 0) result[i] = 100
                else            result[i] = res[i] * 100 / tot[i]
            }
        }
        console.log(result)
        return result
    } catch(e) {
        console.error(e)
        return -1
    }
}

async function UpdatePlacementData(obj, id) {
    try {
        let res = await client.db("telegram-bot").collection("placementRecord").updateOne({"id": id.toString()}, {$set: obj}, {upsert: true})
        if(res) return 0
        else    return 1
    } catch(e) {
        console.error(e)
        return -1
    }
}

async function FindAllPlacementRecord(filterObj) {
    try {
        let res = await client.db("telegram-bot").collection("placementRecord").find(filterObj)
        res = await res.toArray()
        console.log("FindAllPlacementRecord", res.length)
        return res.length
    } catch (e) {
        console.error(e)
        return 0
    }
}

async function errorLog(m) {
    await client.db("telegram-bot").collection("error-logs").insertOne({message: m})
}

async function checkForUser(id) {
    id = id.toString()
    if(await admin.includes(id)) return 0
    if(await isUserExists(id) == 0) {
        bot.telegram.sendMessage(id, "Please Login First")
        return 1
    }
    return 0
}

async function main(){
    try {
        await client.connect()
        console.log("Connection Successful")
        getAllAdmins()
    } catch (e) {
        console.error(e)
    }
}

main().catch(console.error)

app.listen(port,  () => {
    console.log(`Server started on port ${port}`)
})

/* ************************************ DATABASE QUERIES - END ****************************************** */

/* ************************************ Utility Functions ****************************************** */


/* ************************************ MARKUPS ****************************************** */

const requestSubjectName = (ctx, message) => {
    bot.telegram.sendMessage(ctx.chat.id, message, {
        reply_markup: {
            inline_keyboard: [
                [   
                    {
                        text: subjects[0],
                        one_time_keyboard: true,
                        callback_data: 0
                    },
                    {
                        text: subjects[1],
                        one_time_keyboard: true,
                        callback_data: 1
                    },
                    {
                        text: subjects[2],
                        one_time_keyboard: true,
                        callback_data: 2
                    },
                    {
                        text: subjects[3],
                        one_time_keyboard: true,
                        callback_data: 3
                    },
                    {
                        text: subjects[4],
                        one_time_keyboard: true,
                        callback_data: 4
                    },
                    {
                        text: subjects[5],
                        one_time_keyboard: true,
                        callback_data: 5
                    },

                ],
            ]
        }
    })
}

const requestYesNo = (ctx, message) => {
    bot.telegram.sendMessage(ctx.chat.id, message, {
        reply_markup: {
            inline_keyboard: [
                [   {
                        text: "Yes",
                        one_time_keyboard: true,
                        callback_data: 1
                    },
                    {
                        text: "No",
                        one_time_keyboard: true,
                        callback_data: 0
                    }
                ],
            ]
        }
    })
}

const requestOfferType = (ctx, message) => {
    bot.telegram.sendMessage(ctx.chat.id, message, {
        reply_markup: {
            inline_keyboard: [
                [   {
                        text: offers[0],
                        one_time_keyboard: true,
                        callback_data: 0
                    },
                    {
                        text: offers[1],
                        one_time_keyboard: true,
                        callback_data: 1
                    },
                    {
                        text: offers[2],
                        one_time_keyboard: true,
                        callback_data: 2
                    }
                ],
            ]
        }
    })
}


/* ************************************ TELEGRAM INTERACTION - END ****************************************** */

//method to start get the script to pulling updates for telegram 

const startWizard = new WizardScene (
    "start",
    async (ctx) => {
        console.log("startWizard-first-method")
        if(admin.includes(ctx.chat.id.toString())) {
            await ctx.reply(`Welcome Admin`)
            ctx.scene.leave()
        }
        let res = await isUserExists(ctx.chat.id);
        console.log("startWizard-notAdmin-isUserExists-Response:", res)
        if(res == 1) {  // User Exists
            await bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome back`)
            ctx.scene.leave()
        } else if(res == -1) {
            await ctx.reply(`Couldn't Verify. Try again later.`)
            ctx.scene.leave()
        } else {
            console.log("startWizard-second-method")
            await bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome to my telegram bot`)
            await bot.telegram.sendMessage(ctx.chat.id, `Enter your Scholar Number`)
            ctx.wizard.next()
        }
    },
    async (ctx) => {
        await InsertUser(ctx.chat.id, ctx.chat.first_name, ctx.message.text, 2)
        await ctx.reply(`Logged-In`)
        ctx.scene.leave()
    }
)

const askforAdminAccess = new WizardScene (
    "askforAdminAccess",
    async (ctx) => {
        ctx.wizard.state.name = "noName"
        ctx.wizard.state.scholarNo = "xxxxxxxxx"
        console.log("request admin access", ctx.from)
        await ctx.reply(`Enter Your Name`)
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.name = ctx.message.text
        await ctx.reply(`Your Scholar Number`)
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.scholarNo = ctx.message.text
        ctx.wizard.state.prevChatId = ctx.chat.id
        await bot.telegram.sendMessage(ADMIN, `Admin Request\nName: ${ctx.wizard.state.name}\nScholar: ${ctx.wizard.state.scholarNo}\nChatId: ${ctx.chat.id}`)
        await ctx.reply("Your Request for Admin Access has been registered, and will be resolved soon. Thanks for your interest.")
        ctx.scene.leave()
    }
)

const makeAdmin = new WizardScene (
    "makeAdmin",
    async (ctx) => {
        ctx.reply("Who?")
        ctx.wizard.next()
    },
    async (ctx) => {
        InsertAdmin(ctx.message.text)
        await bot.telegram.sendMessage(ctx.message.text, `You have been granted Admin Access.\nI'm sure you will make a great use of it.`)
        ctx.scene.leave()
    }
)

const uploadNotes = new WizardScene (
    "uploadNotes",
    async (ctx) => {
        bot.telegram.sendMessage(ctx.chat.id, 'Choose Subject', requestSubjectName)
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.deleteMessage()
        let res = 
        ctx.wizard.state.subject = ctx.message.text
        bot.telegram.sendMessage(ctx.chat.id, 'Topic Name ?',
            {"reply_to_message_id": ctx.message.message_id}
        )
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.topic_name = ctx.message.text
        bot.telegram.sendMessage(ctx.chat.id, "Upload Pdf",
            {"reply_to_message_id": ctx.message.message_id}
        )
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.file_id = ctx.message.document.file_id
        console.log("wizardStateUploadNotes", ctx.wizard.state)
        if(await InsertNotes(ctx.wizard.state.subject, ctx.wizard.state.topic_name, ctx.wizard.state.file_id) == 0) ctx.reply("Successfully Uploaded")
        else {
            let errorMessage = `Subject: ${ctx.wizard.state.subject}, Topic: ${ctx.wizard.state.topic_name}, fild_id: ${ctx.wizard.state.file_id}`
            errorLog(errorMessage)
            ctx.reply("Couldn't Upload. There has been an error")
        }
        ctx.scene.leave()
    }
)

const downloadNotes = new WizardScene (
    "downloadNotes",
    async (ctx) => {
        requestSubjectName(ctx, "Choose Subject")
        ctx.wizard.next()
    },
    async (ctx) => {
        let res = subjects[ctx.update.callback_query.data]
        ctx.wizard.state.subject = res
        bot.telegram.sendMessage(ctx.chat.id, 'Topic Name')
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.topic_name = res
        console.log(ctx.wizard.state)
        let res = await DownloadNotes(ctx.wizard.state.subject, ctx.wizard.state.topic_name)
        if(res == 0) {
            ctx.reply("Empty List")
        } else if(res) {
            res.forEach(ele => {
                ctx.replyWithDocument(ele)
            })
        } else {
            let errorMessage = `Subject: ${ctx.wizard.state.subject}, Topic: ${ctx.wizard.state.topic_name}, fild_id: ${ctx.wizard.state.file_id}`
            errorLog(errorMessage)
            ctx.reply("Couldn't Download. There has been an error")
        }
        ctx.scene.leave()
    }
)

const updateAttendance = new WizardScene(
    "updateAttendance",
    async (ctx) => {
        requestSubjectName(ctx, "Choose Subject")
        ctx.wizard.next()
    },
    async (ctx) => {
        let res = subjects[ctx.update.callback_query.data]
        res = await UpdateAttendanceinDB(ctx.chat.id, res)
        if(res == 0) ctx.reply("Updated Successfully")
        else ctx.reply("Couldn't Update")
        if(res == -1) {
            errorLog(`While Updating Attendance\nid: ${ctx.chat.id}\n${res}`)
        }
        ctx.scene.leave()
    }
)

const attendancePercengate = new WizardScene(
    "attendancePercengate",
    async (ctx) => {
        let result = await getAttendancePercentage(ctx.chat.id)
        let messageShortage = "", messageA = ""
        for (const i in result) {
            console.log(i, result[i])
            if(result[i] < 75) {
                messageShortage = messageShortage.concat(`\n${i} : ${result[i]}%`)
            } else {
                messageA = messageA.concat(`\n${i} : ${result[i]}%`)
            }
        }
        console.log(messageA, messageShortage)
        if(messageA) ctx.reply(messageA)
        if(messageShortage) ctx.reply("\nShortage:" + messageShortage)
        ctx.scene.leave()
    }
)

const updatePlacementData = new WizardScene(
    "updatePlacementData",
    async (ctx) => {
        ctx.reply("Company")
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.company = ctx.message.text
        ctx.reply("CTC in LPA")
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.CTC = ctx.message.text
        requestOfferType(ctx, "Offer Type?")
        ctx.wizard.next()
    },
    async (ctx) => {
        let res = ctx.update.callback_query.data
        ctx.wizard.state.offerType = offers[res]
        res = await UpdatePlacementData(ctx.wizard.state, res)
        ctx.deleteMessage()
        if(res == 0)    ctx.reply("Updated Successfully")
        else {
            if(res == -1)   errorLog(`Update Placement Record ${obj}`)
            else            ctx.reply("Couldn't Update")
        }
        ctx.scene.leave()
    }
)

const findAllPlacementRecordWithFilter = new WizardScene(
    "findAllPlacementRecordWithFilter",
    async (ctx) => {
        console.log(Date)
        requestYesNo(ctx, "Apply Cap on CTC?")
        ctx.wizard.next()
    },
    async (ctx) => {
        let res = ctx.update.callback_query.data
        ctx.wizard.state.CTCFilter = res
        ctx.deleteMessage()
        if(res == '1') {
            ctx.reply("CTC in LPA")
        } else {
            requestYesNo(ctx, "Filter by Type of Offer ?")
        }
        ctx.wizard.next()
    },
    async (ctx) => {
        console.log(ctx.wizard.state)
        if(ctx.wizard.state.CTCFilter == '1') {
            console.log("44")
            let res = ctx.message.text
            ctx.wizard.state.CTC = res
            requestYesNo(ctx, "Filter by Type of Offer ?")
        } else {
            let res = ctx.update.callback_query.data
            if(res == '1') {
                ctx.deleteMessage()
                ctx.wizard.state.offerTypeFilter = res
                requestOfferType(ctx, "Choose Type")
            } else {
                ctx.deleteMessage()
                let res = await FindAllPlacementRecord({})
                ctx.reply(res)
                ctx.scene.leave()
            }
        }
        ctx.wizard.next()
    },
    async (ctx) => {
        let res = ctx.update.callback_query.data
        if(ctx.wizard.state.CTCFilter == '1') {
            ctx.deleteMessage()
            ctx.wizard.state.offerTypeFilter = res
            if(res == '1') requestOfferType(ctx, "Choose Type")
            else {
                let res = await FindAllPlacementRecord({"CTC": ctx.wizard.state.CTC})
                ctx.reply(res)
                ctx.scene.leave()
            }
        } else {
            ctx.deleteMessage()
            res = await FindAllPlacementRecord({"offerType": offers[res]})
            ctx.reply(res)
            ctx.scene.leave()
        }
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.deleteMessage()
        let res = ctx.update.callback_query.data
        res = await FindAllPlacementRecord({"offerType": offers[res], "CTC": ctx.wizard.state.CTC})
        ctx.reply(res)
        ctx.scene.leave()
    }
)

/* ********************************************************************* */

const stage = new Stage([startWizard, askforAdminAccess, makeAdmin, uploadNotes, downloadNotes, updateAttendance, attendancePercengate, updatePlacementData, findAllPlacementRecordWithFilter])
stage.command('cancel', (ctx) => {
    ctx.reply("Operation canceled")
    return ctx.scene.leave()
})
bot.use(stage.middleware())


/* ************************     BOT - commands      ********************** */


bot.start(async (ctx) => {
    console.log("start-command")
    await ctx.scene.enter("start")
})

bot.command("command1", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    console.log("command1-AskforAdminAccess")
    if(admin.includes(ctx.chat.id.toString())) {
        await ctx.reply(`You already have Admin Access`)
    } else {
        await ctx.scene.enter("askforAdminAccess")
    }
})

bot.command("command2", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    if(ctx.chat.id != ADMIN) {
        await ctx.reply("You Don't have this privilege.\nHave a good day.")
    } else {
        await ctx.scene.enter("makeAdmin")
    }
})

bot.command("command3", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    if(admin.includes(ctx.chat.id.toString())) {
        await ctx.scene.enter("uploadNotes")
    } else {
        await ctx.reply("You Don't have this privilege.\nHave a good day.")
    }
})

bot.command("command4", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    await ctx.scene.enter("downloadNotes")
})

bot.command("command5", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    await ctx.scene.enter("updateAttendance")
})

bot.command("command6", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    await ctx.scene.enter("attendancePercengate")
})

bot.command("command7", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    await ctx.scene.enter("updatePlacementData")
})

bot.command("command8", async (ctx) => {
    if(await checkForUser(ctx.chat.id)) return
    if(admin.includes(ctx.chat.id.toString())) {
        await ctx.scene.enter("findAllPlacementRecordWithFilter")
    } else {
        await ctx.reply("You Don't have this privilege.\nHave a good day.")
    }
})

// bot.command("command9", async (ctx) => {
//     ctx.deleteMessage()
//     if(await checkForUser(ctx.chat.id)) return
//     await ctx.scene.enter("findAllPlacementRecordWithFilter")
// })


bot.launch()