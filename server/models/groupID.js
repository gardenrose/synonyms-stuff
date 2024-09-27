const mongoose = require("mongoose");

const groupIdSchema = new mongoose.Schema({
  MAX_GROUP_ID: { type: Number, required: true, unique: true },
});

const GroupID = mongoose.model("GroupID", groupIdSchema, "groupID");

module.exports = GroupID;
