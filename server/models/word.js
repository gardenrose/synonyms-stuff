const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  NAME: { type: String, required: true },
  WORD_GROUP: { type: Number, required: true },
});

const Word = mongoose.model("Word", wordSchema, "word");

module.exports = Word;
