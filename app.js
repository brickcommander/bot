const Telegraf = require('telegraf');
const dotenv = require("dotenv");

dotenv.config({path: './config.env' });

const TOKEN = process.env.TOKEN;
const bot = new Telegraf(TOKEN);
const GOD = process.env.ADMIN; // ADMIN

const admin = [GOD];

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
        console.log("E", res, id);
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
        console.log("I", res);
    } catch (e) {
        console.error(e);
    }
}

async function getUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").findOne({id: id});
        console.log("G", res);
    } catch (e) {
        console.error(e);
    }
}

async function deleteUser(id) {
    try {
        let res = await client.db("telegram-bot").collection("users").deleteOne({id: id});
        console.log("D", res);
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


bot.command('start', async (ctx) => {
    console.log("Start", ctx.from);

    if(admin.includes(ctx.chat.id.toString())) {
        await ctx.reply(`Welcome Boss`);
        // await handleAdminStart(ctx);
    } else {
        // Queries, if user exists or not
        let res = await isUserExists(ctx.chat.id);
        console.log("C", res);

        if(res == 0) {  // User Does Not Exist
            bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome to my telegram bot`);
            bot.telegram.sendMessage(ctx.chat.id, `Enter your Scholar Number`);
            bot.on('text', async (ctx) => {
                await InsertUser(ctx.chat.id, ctx.chat.first_name, ctx.message.text, 2);
                await ctx.reply(`Logged-In`);
            });
        } else if(res == -1) {
            await ctx.reply(`Couldn't Verify. Try again later.`);
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `Hi ${ctx.from.first_name}! Welcome back`);
        }
    }
})


bot.command('command1', async (ctx) => {
    console.log("request admin access", ctx.from);

    if(admin.includes(ctx.chat.id.toString())) {
        await ctx.reply(`You Are an Admin`);
    } else {
            let name = "no_name";
            let scholar_no = "xxxxxxxxx";
            await bot.telegram.sendMessage(ctx.chat.id, `Enter Your Name`);
            await bot.on('text', async (ctx, next) => {
                console.log(ctx.message.txt);
                next();
            })

            await bot.telegram.sendMessage(ctx.chat.id, `Your Scholar Number`);
            await bot.on('text', async (ctx, next) => {
                scholar_no = ctx.message.text;
                next()
            })
            await bot.telegram.sendMessage(GOD, `Boss, ${name} -> ${scholar_no} requesting Admin Access`);

    
            // bot.telegram.sendMessage(ctx.chat.id, `Enter your Scholar Number`);
            // await InsertUser(ctx.chat.id, ctx.chat.first_name, ctx.message.text, 2);
            // await ctx.reply(`Logged-In`);
    }
})


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
bot.launch();






















            // Explicit usage
            // await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);