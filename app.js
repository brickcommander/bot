const Telegraf = require('telegraf');
const dotenv = require("dotenv");

const WizardScene = require("telegraf/scenes/wizard");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");

dotenv.config({path: './config.env' });

const TOKEN = process.env.TOKEN;
const bot = new Telegraf(TOKEN);
const GOD = process.env.ADMIN; // ADMIN

const admin = [GOD];

bot.use(session());

/* ************************************ CONNECTION TO DATABASE - START ****************************************** */

const express = require("express");
const { MongoClient } = require('mongodb');
const app = express();

const DB = process.env.DATABASE;
const port = process.env.PORT;
const client = new MongoClient(DB);

const User = require("./models/user");

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


//method that displays the inline keyboard buttons 
bot.hears('animals', ctx => {
    console.log(ctx.from)
    let animalMessage = `great, here are pictures of animals you would love`;
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
    bot.telegram.sendMessage(ctx.chat.id, 'Can we get access to your phone number?', requestPhoneKeyboard);

})

//method for requesting user's location
bot.hears("location", (ctx) => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'Can we access your location?', requestLocationKeyboard);
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
};

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


/* ************************************ TELEGRAM INTERACTION - END ****************************************** */

//method to start get the script to pulling updates for telegram 

const startWizard = new WizardScene (
    "start",
    async (ctx) => {
        console.log("startWizard-first-method");
        if(admin.includes(ctx.chat.id.toString())) {
            await ctx.reply(`Welcome Boss`);
            return ctx.scene.leave();
        }
        let res = await isUserExists(ctx.chat.id);
        console.log("startWizard-notAdmin-isUserExists-Response:", res);
        if(res == 1) {  // User Exists
            await bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome back`);
            return ctx.scene.leave();
        } else if(res == -1) {
            await ctx.reply(`Couldn't Verify. Try again later.`);
            return ctx.scene.leave();
        } else {
            console.log("startWizard-second-method");
            await bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome to my telegram bot`);
            await bot.telegram.sendMessage(ctx.chat.id, `Enter your Scholar Number`);
            return ctx.wizard.next();
        }
    },
    async (ctx) => {
        await InsertUser(ctx.chat.id, ctx.chat.first_name, ctx.message.text, 2);
        await ctx.reply(`Logged-In`);
        ctx.scene.leave();
        return ctx.scene.leave();
    }
);

const askforAdminAccess = new WizardScene (
    "askforAdminAccess",
    async (ctx) => {
        ctx.wizard.state.name = "noName";
        ctx.wizard.state.scholarNo = "xxxxxxxxx";
        console.log("request admin access", ctx.from);
        if(admin.includes(ctx.chat.id.toString())) {
            await ctx.reply(`You already have Admin Access`);
            return ctx.scene.leave();
        }
        await ctx.reply(`Enter Your Name`);
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        await ctx.reply(`Your Scholar Number`);
        ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.scholarNo = ctx.message.text;
        ctx.wizard.state.prevChatId = ctx.chat.id;
        await bot.telegram.sendMessage(GOD, `Admin Request\nName: ${ctx.wizard.state.name}\nScholar: ${ctx.wizard.state.scholarNo}\nChatId: ${ctx.chat.id}`);
        await ctx.reply("Your Request for Admin Access has been registered, and will be resolved soon. Thanks for your interest.");
        ctx.scene.leave();
    }
);

const makeAdmin = new WizardScene (
    "makeAdmin",
    async (ctx) => {
        ctx.reply("Who?");
        ctx.wizard.next();
    },
    async (ctx) => {
        InsertAdmin(ctx.message.text);
        await bot.telegram.sendMessage(ctx.message.text, `You have been granted Admin Access.\nI'm sure you will make a great use of it.`);
        ctx.scene.leave();
    }
)

/* ********************************************************************* */

const stage = new Stage([startWizard, askforAdminAccess, makeAdmin])
stage.command('cancel', (ctx) => {
    ctx.reply("Operation canceled")
    return ctx.scene.leave()
})
bot.use(stage.middleware())


/* ************************     BOT - commands      ********************** */


bot.start(async (ctx) => {
    console.log("start-command")
    ctx.scene.enter("start")
})

bot.command("command1", async (ctx) => {
    console.log("command1-AskforAdminAccess")
    ctx.scene.enter("askforAdminAccess");
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
bot.command("makeAdmin", async (ctx) => {
    if(ctx.chat.id != GOD) {
        await ctx.reply("You Don't have this privilege.\nHave a good day.");
    } else {
        ctx.scene.enter("makeAdmin");
    }
})


bot.launch()




















// Explicit usage
// await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);