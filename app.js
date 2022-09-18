const Telegraf = require('telegraf');
const dotenv = require("dotenv");

const WizardScene = require("telegraf/scenes/wizard");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");

dotenv.config({path: './config.env' });

const TOKEN = process.env.TOKEN;
const bot = new Telegraf(TOKEN);
const ADMIN = process.env.ADMIN; // ADMIN

const {admin, isUserExists, getUser, deleteUser, InsertAdmin, getAllAdmins, isAMember} = require("./Database/mongo");

const {stage, startWizard, askforAdminAccess, makeAdmin} = require("./commandHandler/commandHandler");

bot.use(session());

//method that displays the inline keyboard buttons 
bot.hears('animals', ctx => {
    console.log(ctx.from)
    let animalMessage = `great, here are pictures of animals you would love`;
    ctx.deleteMessage();
    bot.telegram.sendMessage(ctx.chat.id, animalMessage, {
        reply_markup: {
            inline_keyboard: [
                [   
                    {
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

bot.use(stage.middleware())

bot.start(async (ctx) => {
    console.log("start-command")
    ctx.scene.enter("start")
})

bot.command("command1", async (ctx) => {
    console.log("command1-AskforAdminAccess")
    if(ctx.chat.id != ADMIN) {
        let res = await isAMember(ctx.chat.id.toString());
        if(res == 0) {
            ctx.reply("First Login with /start command");
            return;
        }
    }
    ctx.scene.enter("askforAdminAccess")
})

bot.command("command2", async (ctx) => {
    console.log("command2-makeAdmin")
    let res = await isAMember(ctx.chat.id.toString());
    if(res == 0) {
        ctx.reply("Login with /start command first");
        return;
    }
    if(ctx.chat.id != ADMIN) {
        await ctx.reply("You Don't have this privilege.\nHave a good day.");
    } else {
        ctx.scene.enter("makeAdmin");
    }
})


bot.launch()


// Definition

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




















// Explicit usage
// await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);