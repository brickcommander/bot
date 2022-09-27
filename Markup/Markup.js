const { subjects, offers } = require("../Database/conn");

const requestSubjectName = (ctx, message) => {
  ctx.replyWithMarkdown(message, {
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
  ctx.replyWithMarkdown(message, {
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
  ctx.replyWithMarkdown(message, {
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

const requestDocument = (ctx, message) => {
  ctx.replyWithMarkdown(message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "No",
            one_time_keyboard: true,
            callback_data: 0,
          },
          {
            text: "PDF",
            one_time_keyboard: true,
            callback_data: "PDF", // PDF
          },
          {
            text: "Image",
            one_time_keyboard: true,
            callback_data: "Image", // Image
          },
        ],
      ],
    },
  });
};

module.exports = {
  requestSubjectName,
  requestYesNo,
  requestOfferType,
  requestDocument,
};
