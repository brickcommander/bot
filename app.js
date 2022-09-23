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
bot.use(session())

/* ************************************ CONNECTION TO DATABASE - START ****************************************** */

const express = require("express");
const { MongoClient, ConnectionCheckOutFailedEvent } = require('mongodb');
const app = express();

const DB = process.env.DATABASE;
const port = process.env.PORT;
const client = new MongoClient(DB);

const User = require("./models/user")
const notes2 = require("./models/notes")

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
        let user = new User({"id": id, "name": name, "sch": sch, "sec": sec})
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

async function errorLog(m) {
    await client.db("telegram-bot").collection("error-logs").insertOne({message: m})
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


/* ************************************ CONNECTION TO DATABASE - END ****************************************** */



/* ************************************ TELEGRAM INTERACTION ****************************************** */

// START COMMAND ->
    // Check if user exists or not
    // If it does, enter
    // Else, take the credentials


/* ************************************ HANDLING ADMIN ****************************************** */

// async function handleAdminStart(ctx) {

// }

// async function isAdmin(id) {
//     let res = await client.db("telegram-bot").collection("admins").findOne({id: id.toString()});
//     console.log(res);
//     if(res) return 1;
//     else    return 0;
// }

/* ************************************ HANDLING ADMIN - END ****************************************** */
/* ************************************ TELEGRAM INTERACTION ****************************************** */
/* ************************************ TELEGRAM INTERACTION ****************************************** */


async function checkForUser(id) {
    id = id.toString()
    if(await admin.includes(id)) return 0
    if(await isUserExists(id) == 0) {
        bot.telegram.sendMessage(id, "Please Login First")
        return 1
    }
    return 0
}


//method that displays the inline keyboard buttons 
bot.hears('animals', ctx => {
    console.log(ctx.from)
    let animalMessage = `great, here are pictures of animals you would love`
    ctx.deleteMessage();
    bot.telegram.sendMessage(ctx.chat.id, animalMessage, {
        reply_markup: {
            inline_keyboard: [
                [   {
                        text: "dog",
                        callback_data: 'dog'
                    },
                    {
                        text: "cat",
                        callback_data: 'cat'
                    }
                ],
            ]
        }
    })
})

//method that returns image of a dog
bot.action('dog', ctx => {
    bot.telegram.sendPhoto(ctx.chat.id, {
        source: "res/dog.jpg"
    })
})

//method that returns image of a cat 
bot.action('cat', ctx => {
    bot.telegram.sendPhoto(ctx.chat.id, {
        source: "res/cat.png"
    })
})

//method for requesting user's phone number
bot.hears('phone', (ctx, next) => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'Can we get access to your phone number?', requestPhoneKeyboard)

})

//method for requesting user's location
bot.hears("location", (ctx) => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'Can we access your location?', requestLocationKeyboard)
})

bot.command("images", (ctx) => {
    console.log("Images")
    console.log(ctx)
})

bot.on('photo', (ctx) => {
    console.log("mediagroup")
    console.log(ctx.message.photo)
})

//constructor for providing phone number to the bot
const requestPhoneKeyboard = {
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [
            [{
                text: "My phone number",
                request_contact: true,
                one_time_keyboard: true
            }],
            ["Cancel"]
        ]
    }
}

//constructor for proving location to the bot
const requestLocationKeyboard = {
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [
            [{
                text: "My location",
                request_location: true,
                one_time_keyboard: true
            }],
            ["Cancel"]
        ]
    }
}

const requestSubjectName = {
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [
            [{
                text: "Web Search and Mining",
                one_time_keyboard: true
            }],
            [{
                text: "TCP/IP",
                one_time_keyboard: true
            }],
            [{
                text: "Ethical Hacking",
                one_time_keyboard: true
            }],
            [{
                text: "Cloud Computing",
                one_time_keyboard: true
            }],
            [{
                text: "Mobile Computing",
                one_time_keyboard: true
            }],
            [{
                text: "Network Security",
                one_time_keyboard: true
            }],
            [{
                text: "Distributed Computing",
                one_time_keyboard: true
            }],
            [{
                text: "Cancel",
                one_time_keyboard: true
            }],
        ]
    }
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
        if(ctx.message.text == "Cancel") return ctx.scene.leave()
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
        bot.telegram.sendMessage(ctx.chat.id, 'Choose Subject', requestSubjectName)
        ctx.wizard.next()
    },
    async (ctx) => {
        if(ctx.message.text == "Cancel") return ctx.scene.leave()
        ctx.wizard.state.subject = ctx.message.text
        bot.telegram.sendMessage(ctx.chat.id, 'Topic Name',
            {"reply_to_message_id": ctx.message.message_id}
        )
        ctx.wizard.next()
    },
    async (ctx) => {
        ctx.wizard.state.topic_name = ctx.message.text
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

/* ********************************************************************* */

const stage = new Stage([startWizard, askforAdminAccess, makeAdmin, uploadNotes, downloadNotes])
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

/* ***********************    BOT - actions        *********************** */

// bot.action('YesAdminAccess', async (ctx) => {
//     console.log("YesAdminAccess");
//     await bot.telegram.sendMessage(, "Access Granted");
// })
// bot.action('NoAdminAccess', async (ctx) => {
//     console.log("NoAdminAccess");
//     await bot.telegram.sendMessage(ctx.wizard.state.prevChatId, "Request Delined");
// })

/* *************************** ADMIN - commands     *************************** */



bot.launch()




















// Explicit usage
// await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);