const express = require("express");
const router = express.Router();
const Word = require("../models/word");
const GroupID = require("../models/groupid");

/* 
    This route was not used, it only serves for checking what words are currently in db.
*/
router.get("/getAllWords", async (req, res) => {
  try {
    const allWords = await Word.find({}, { NAME: 1, WORD_GROUP: 1, _id: 1 });

    return res.json({ allWords });
  } catch (error) {
    console.error("Error fetching all words:", error);
    res.status(500).send("Error fetching words data");
  }
});

// in case of adding new words, this will return the highest group id,
// and adding 1 to it will determine the group ID of a new word.
const getMaxGroupId = async () => {
  try {
    const firstItem = await GroupID.findOne()
      .sort({ _id: 1 })
      .select("MAX_GROUP_ID");
    return firstItem ? firstItem.MAX_GROUP_ID : null;
  } catch (error) {
    throw new Error("Error retrieving MAX_GROUP_ID: " + error.message);
  }
};

// When a new word(s) is saved to db and its group id is determined,
// then it gets saved here, as it is a new max group id.
const updateMaxGroupId = async (currentMaxId) => {
  try {
    const newMaxId = currentMaxId + 1;
    const updatedItem = await GroupID.findOneAndUpdate(
      {},
      { MAX_GROUP_ID: newMaxId },
      { new: true }
    );
    return updatedItem ? updatedItem.MAX_GROUP_ID : null;
  } catch (error) {
    throw new Error("Error incrementing MAX_GROUP_ID: " + error.message);
  }
};

/*
    This searches for synonyms of a word by name that user enters.
*/
router.get("/getSynonyms", async (req, res) => {
  try {
    const { name } = req.query;
    let wordsData = [];

    if (name) {
      wordsData = await Word.find({ NAME: name });
    } else {
      wordsData = await Word.find();
    }

    if (wordsData.length > 0) {
      const response = [];

      for (const word of wordsData) {
        const relatedWords = await Word.find({
          WORD_GROUP: word.WORD_GROUP,
          NAME: { $ne: word.NAME },
        });

        response.push({
          word: word.NAME,
          group: word.WORD_GROUP,
          synonyms: relatedWords.map((rw) => rw.NAME),
        });
      }

      return res.json({ matchedWords: response });
    }

    res.json({ matchedWords: [] });
  } catch (error) {
    console.error("Error fetching words data:", error);
    res.status(500).send("Error fetching words data");
  }
});

// Insert a new word with its synonyms. But only insert if there is no
// same word in the db with atleast one same synonym. Inserting a word
// that is in already in db is fine, as some words can be written the
// same but mean different things, but inserting a word that already exists,
// and inserting synonyms for it that exist too implies that it's probably
// the same word, same context.
router.post("/insertWord", async (req, res) => {
  try {
    const { mainWord, synonyms, groupId } = req.body;
    console.log(req.body);

    // If any of these is ommited, do not proceed with insertion.
    // Main word must be provided with atleast 1 synonym.
    if (!mainWord || !Array.isArray(synonyms)) {
      return res.status(400).send("Invalid input");
    }

    // If group id is provided, only check for conflicts in groups with
    // different group id because otherwise all synonyms would be
    // considered conflicting.
    const groupFilter = groupId ? { $ne: groupId } : { $exists: true };

    const existingWords = await Word.find({ NAME: mainWord });
    const groupIds = new Set(existingWords.map((word) => word.WORD_GROUP));

    const existingSynonyms = await Word.find({
      WORD_GROUP: { $in: [...groupIds], ...groupFilter },
      NAME: { $ne: mainWord },
    });

    const existingSynonymNames = new Set(
      existingSynonyms.map((word) => word.NAME.toLowerCase())
    );

    const lowerCaseSynonyms = synonyms.map((synonym) => synonym.toLowerCase());
    const foundSynonym = lowerCaseSynonyms.some((synonym) =>
      existingSynonymNames.has(synonym)
    );

    // 2 or more synonyms are overlapping with another group.
    if (foundSynonym) {
      return res.status(409).send("A word with this context already exists.");
    }

    // If group id is not provided, calculate the new one by simply getting
    // max group id from DB and incrementing it by 1. Also, save the incremented
    // value back to DB as it now becomes max group id.
    let newGroupId = groupId;

    if (!newGroupId) {
      const currentMaxId = await getMaxGroupId();
      newGroupId = currentMaxId + 1;

      await updateMaxGroupId(currentMaxId);
    }

    // Main word should be saved too ONLY if the group id is not provided,
    // because if it is, then it means that main word is already in DB and
    // no need to store it twice in same group.
    if (!groupId) {
      await Word.create({
        NAME: mainWord,
        WORD_GROUP: newGroupId,
      });
    }

    // Save all valid synonyms to DB.
    const synonymDocuments = synonyms.map((synonym) => ({
      NAME: synonym,
      WORD_GROUP: newGroupId,
    }));

    await Word.insertMany(synonymDocuments);

    res.status(200).send("Word and synonyms inserted successfully.");
  } catch (error) {
    console.error("Error inserting word:", error);
    res.status(500).send("Error inserting word");
  }
});

module.exports = router;
