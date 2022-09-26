const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const placement = new Schema({
  name: {
    type: String,
    required: false,
  },
  scholar: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  CTC: {
    type: String,
    required: true,
  },
  offerType: {
    type: String,
    required: true,
  },
});

const placementData = mongoose.model("placementData", placement);
module.exports = placementData;
