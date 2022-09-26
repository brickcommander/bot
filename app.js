const Telegraf = require("telegraf");
const dotenv = require("dotenv");

// const fs = require("fs")

const WizardScene = require("telegraf/scenes/wizard");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");

dotenv.config({ path: "./config.env" });

const TOKEN = process.env.TOKEN;
const bot = new Telegraf(TOKEN);
const ADMIN = process.env.ADMIN; // ADMIN

bot.use(session());

/* **************************** DATABASE **************************** */

const express = require("express");
const app = express();
const port = process.env.PORT;

const {
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
} = require("./Database/conn");

main().catch(console.error);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

/* ************************************ MARKUPS ****************************************** */

const requestSubjectName = (ctx, message) => {
  bot.telegram.sendMessage(ctx.chat.id, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: subjects[0],
            one_time_keyboard: true,
            callback_data: 0,
          },
          {
            text: subjects[1],
            one_time_keyboard: true,
            callback_data: 1,
          },
          {
            text: subjects[2],
            one_time_keyboard: true,
            callback_data: 2,
          },
          {
            text: subjects[3],
            one_time_keyboard: true,
            callback_data: 3,
          },
          {
            text: subjects[4],
            one_time_keyboard: true,
            callback_data: 4,
          },
          {
            text: subjects[5],
            one_time_keyboard: true,
            callback_data: 5,
          },
        ],
      ],
    },
  });
};

const requestYesNo = (ctx, message) => {
  bot.telegram.sendMessage(ctx.chat.id, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Yes",
            one_time_keyboard: true,
            callback_data: 1,
          },
          {
            text: "No",
            one_time_keyboard: true,
            callback_data: 0,
          },
        ],
      ],
    },
  });
};

const requestOfferType = (ctx, message) => {
  bot.telegram.sendMessage(ctx.chat.id, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: offers[0],
            one_time_keyboard: true,
            callback_data: 0,
          },
          {
            text: offers[1],
            one_time_keyboard: true,
            callback_data: 1,
          },
          {
            text: offers[2],
            one_time_keyboard: true,
            callback_data: 2,
          },
        ],
      ],
    },
  });
};

/* ************************************ TELEGRAM INTERACTION - END ****************************************** */

//method to start get the script to pulling updates for telegram

const startWizard = new WizardScene(
  "start",
  async (ctx) => {
    console.log("startWizard-first-method");
    if (admin.includes(ctx.chat.id.toString())) {
      await ctx.reply(`Welcome Admin`);
      return ctx.scene.leave();
    }
    let res = await isUserExists(ctx.chat.id);
    console.log("startWizard-notAdmin-isUserExists-Response:", res);
    if (res == 1) {
      // User Exists
      await bot.telegram.sendMessage(
        ctx.chat.id,
        `Hi ${ctx.from.first_name}! Welcome back`
      );
      return ctx.scene.leave();
    } else if (res == -1) {
      await ctx.reply(`Couldn't Verify. Try again later.`);
      return ctx.scene.leave();
    } else {
      console.log("startWizard-second-method");
      await bot.telegram.sendMessage(
        ctx.chat.id,
        `Hi ${ctx.from.first_name}! Welcome to my telegram bot`
      );
      await bot.telegram.sendMessage(ctx.chat.id, `Enter your Scholar Number`);
      return ctx.wizard.next();
    }
  },
  async (ctx) => {
    await InsertUser(ctx.chat.id, ctx.chat.first_name, ctx.message.text, 2);
    await ctx.reply(`Logged-In`);
    return ctx.scene.leave();
  }
);

const askforAdminAccess = new WizardScene(
  "askforAdminAccess",
  async (ctx) => {
    ctx.wizard.state.name = "noName";
    ctx.wizard.state.scholarNo = "xxxxxxxxx";
    console.log("request admin access", ctx.from);
    await ctx.reply(`Enter Your Name`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    await ctx.reply(`Your Scholar Number`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.scholarNo = ctx.message.text;
    ctx.wizard.state.prevChatId = ctx.chat.id;
    console.log("Fe");
    await ctx.reply(
      "Your Request for Admin Access has been registered, and will be resolved soon. Thanks for your interest."
    );
    await bot.telegram.sendMessage(
      ADMIN,
      `Admin Request\nName: ${ctx.wizard.state.name}\nScholar: ${ctx.wizard.state.scholarNo}\nChatId: ${ctx.chat.id}`
    );
    return ctx.scene.leave();
  }
);

const makeAdmin = new WizardScene(
  "makeAdmin",
  async (ctx) => {
    ctx.reply("Who?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = ctx.message.text;
    if (admin.includes(res)) {
      await ctx.reply("Already an Admin");
      return ctx.scene.leave();
    }
    InsertAdmin(res);
    await bot.telegram.sendMessage(
      res,
      `You have been granted Admin Access.\nI'm sure you will make a great use of it.`
    );
    return ctx.scene.leave();
  }
);

const uploadNotes = new WizardScene(
  "uploadNotes",
  async (ctx) => {
    requestSubjectName(ctx, "Choose Subject");
    ctx.wizard.next();
  },
  async (ctx) => {
    // ctx.deleteMessage();
    ctx.wizard.state.subject = subjects[ctx.update.callback_query.data];
    bot.telegram.sendMessage(ctx.chat.id, "Enter Topic Name");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.topic_name = ctx.message.text;
    bot.telegram.sendMessage(ctx.chat.id, "Upload Pdf", {
      reply_to_message_id: ctx.message.message_id,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.file_id = ctx.message.document.file_id;
    console.log("wizardStateUploadNotes", ctx.wizard.state);
    if (
      (await InsertNotes(
        ctx.wizard.state.subject,
        ctx.wizard.state.topic_name,
        ctx.wizard.state.file_id
      )) == 0
    )
      ctx.reply("Successfully Uploaded");
    else {
      let errorMessage = `Subject: ${ctx.wizard.state.subject}, Topic: ${ctx.wizard.state.topic_name}, fild_id: ${ctx.wizard.state.file_id}`;
      errorLog(errorMessage);
      ctx.reply("Couldn't Upload. There has been an error");
    }
    return ctx.scene.leave();
  }
);

const downloadNotes = new WizardScene(
  "downloadNotes",
  async (ctx) => {
    requestSubjectName(ctx, "Choose Subject");
    return ctx.wizard.next();
  },
  async (ctx) => {
    // ctx.deleteMessage();
    let res = subjects[ctx.update.callback_query.data];
    ctx.wizard.state.subject = res;
    bot.telegram.sendMessage(ctx.chat.id, "Enter Topic Name");
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = ctx.message.text;
    ctx.wizard.state.topic_name = res;
    console.log(ctx.wizard.state);
    res = await DownloadNotes(
      ctx.wizard.state.subject,
      ctx.wizard.state.topic_name
    );
    if (res == 0) {
      ctx.reply("Empty List");
    } else if (res) {
      res.forEach((ele) => {
        ctx.replyWithDocument(ele);
      });
    } else {
      let errorMessage = `Subject: ${ctx.wizard.state.subject}, Topic: ${ctx.wizard.state.topic_name}, fild_id: ${ctx.wizard.state.file_id}`;
      errorLog(errorMessage);
      ctx.reply("Couldn't Download. There has been an error");
    }
    return ctx.scene.leave();
  }
);

const updateAttendance = new WizardScene(
  "updateAttendance",
  async (ctx) => {
    requestSubjectName(ctx, "Choose Subject");
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = subjects[ctx.update.callback_query.data];
    res = await UpdateAttendanceinDB(ctx.chat.id, res);
    if (res == 0) ctx.reply("Updated Successfully");
    else ctx.reply("Couldn't Update");
    if (res == -1) {
      errorLog(`While Updating Attendance\nid: ${ctx.chat.id}\n${res}`);
    }
    return ctx.scene.leave();
  }
);

const attendancePercengate = new WizardScene(
  "attendancePercengate",
  async (ctx) => {
    let result = await getAttendancePercentage(ctx.chat.id);
    let messageShortage = "",
      messageA = "";
    for (const i in result) {
      console.log(i, result[i]);
      if (result[i] < 75) {
        messageShortage = messageShortage.concat(`\n${i} : ${result[i]}%`);
      } else {
        messageA = messageA.concat(`\n${i} : ${result[i]}%`);
      }
    }
    console.log(messageA, messageShortage);
    if (messageA) ctx.reply(messageA);
    if (messageShortage) ctx.reply("\nShortage:" + messageShortage);
    return ctx.scene.leave();
  }
);

const updatePlacementData = new WizardScene(
  "updatePlacementData",
  async (ctx) => {
    ctx.reply("Name");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply("Scholar");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.scholar = ctx.message.text;
    ctx.reply("Company");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.company = ctx.message.text;
    ctx.reply("CTC in LPA");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.CTC = ctx.message.text;
    requestOfferType(ctx, "Offer Type ?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = ctx.update.callback_query.data;
    ctx.wizard.state.offerType = offers[res];
    res = await UpdatePlacementData(ctx.wizard.state);
    ctx.deleteMessage();
    if (res == 0) ctx.reply("Updated Successfully");
    else {
      if (res == -1) errorLog(`Update Placement Record ${obj}`);
      else ctx.reply("Couldn't Update");
    }
    return ctx.scene.leave();
  }
);

const findAllPlacementRecordWithFilter = new WizardScene(
  "findAllPlacementRecordWithFilter",
  async (ctx) => {
    console.log(Date);
    requestYesNo(ctx, "Apply Cap on CTC?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = ctx.update.callback_query.data;
    ctx.wizard.state.CTCFilter = res;
    ctx.deleteMessage();
    if (res == "1") {
      ctx.reply("CTC in LPA");
    } else {
      requestYesNo(ctx, "Filter by Type of Offer ?");
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log(ctx.wizard.state);
    if (ctx.wizard.state.CTCFilter == "1") {
      console.log("44");
      let res = ctx.message.text;
      ctx.wizard.state.CTC = res;
      requestYesNo(ctx, "Filter by Type of Offer ?");
    } else {
      let res = ctx.update.callback_query.data;
      if (res == "1") {
        ctx.deleteMessage();
        ctx.wizard.state.offerTypeFilter = res;
        requestOfferType(ctx, "Choose Type");
      } else {
        ctx.deleteMessage();
        let res = await FindAllPlacementRecord({});
        ctx.reply(res);
        return ctx.scene.leave();
      }
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    let res = ctx.update.callback_query.data;
    if (ctx.wizard.state.CTCFilter == "1") {
      ctx.deleteMessage();
      ctx.wizard.state.offerTypeFilter = res;
      if (res == "1") requestOfferType(ctx, "Choose Type");
      else {
        let res = await FindAllPlacementRecord({
          CTC: { $lt: ctx.wizard.state.CTC },
        });
        ctx.reply(res);
        return ctx.scene.leave();
      }
    } else {
      ctx.deleteMessage();
      res = await FindAllPlacementRecord({ offerType: offers[res] });
      ctx.reply(res);
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.deleteMessage();
    let res = ctx.update.callback_query.data;
    res = await FindAllPlacementRecord({
      offerType: offers[res],
      CTC: { $lt: ctx.wizard.state.CTC },
    });
    ctx.reply(res);
    return ctx.scene.leave();
  }
);

/* ********************************************************************* */

const stage = new Stage([
  startWizard,
  askforAdminAccess,
  makeAdmin,
  uploadNotes,
  downloadNotes,
  updateAttendance,
  attendancePercengate,
  updatePlacementData,
  findAllPlacementRecordWithFilter,
]);
stage.command("cancel", (ctx) => {
  ctx.reply("Operation canceled");
  return ctx.scene.leave();
});
bot.use(stage.middleware());

/* ************************     BOT - commands      ********************** */

bot.start(async (ctx) => {
  console.log("start-command");
  await ctx.scene.enter("start");
});

bot.command("ask_admin_access", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  console.log("command1-AskforAdminAccess");
  if (admin.includes(ctx.chat.id.toString())) {
    await ctx.reply(`You already have Admin Access`);
  } else {
    await ctx.scene.enter("askforAdminAccess");
  }
});

bot.command("make_admin", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  if (ctx.chat.id != ADMIN) {
    await ctx.reply("!!Dev.\nHave a good day.");
  } else {
    await ctx.scene.enter("makeAdmin");
  }
});

bot.command("upload_notes", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  if (admin.includes(ctx.chat.id.toString())) {
    await ctx.scene.enter("uploadNotes");
  } else {
    await ctx.reply("You Don't have this privilege.\nHave a good day.");
  }
});

bot.command("download_notes", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  await ctx.scene.enter("downloadNotes");
});

bot.command("update_attendance", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  await ctx.scene.enter("updateAttendance");
});

bot.command("attendance_percengate", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  await ctx.scene.enter("attendancePercengate");
});

bot.command("update_placement_data", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  if (admin.includes(ctx.chat.id.toString())) {
    await ctx.scene.enter("updatePlacementData");
  } else {
    await ctx.reply("You Don't have this privilege.\nHave a good day.");
  }
});

bot.command("find_placement_records", async (ctx) => {
  if (await checkForUser(ctx.chat.id)) return;
  await ctx.scene.enter("findAllPlacementRecordWithFilter");
});

bot.launch();
