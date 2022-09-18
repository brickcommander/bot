const WizardScene = require("telegraf/scenes/wizard");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");

var {admin, isUserExists, getUser, deleteUser, InsertAdmin, getAllAdmins, isAMember} = require("../Database/mongo");

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


/* ************************     BOT - commands     ********************** */

module.exports = {stage, startWizard, askforAdminAccess, makeAdmin}