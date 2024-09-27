# synonyms-stuff
## Description
This is a MERN (MongoDB + Express.js + React.js + Node.js) app for synonyms. The user searches for a word or expression and gets the list of its synonyms. If the word isn't in the db, or doesn't have any synonym, it is possible to create them. The search works as "=" (exact match) and not "contains". If there are words that are the same in written form, but can mean different things, they will be grouped with different synonyms and, when searching for words like those, all results will show, with their synonyms (up to 4) in parenthesis. Then the user can choose which one to look up (example of a word like that is bow, it can mean to bend forward and a weapon). When entering new words, the app will make sure to not save duplicates to db as well as empty strings. In addition, when attempting to insert a group of synonyms, the app will check all other groups and if only 1 word matches, the group can be inserted, but if 2 or more words match it won't be inserted to prevent overlapping groups.

## List of models
`Word ({
  NAME: { type: String, required: true },
  WORD_GROUP: { type: Number, required: true },
})`,<br>
`GroupID ({
  MAX_GROUP_ID: { type: Number, required: true, unique: true },
})`<br>
The `word` model also has unique _id tag as primary key, so that the name is not unique and the word_group helps connect all synonyms withuot having to connect them through foreign keys. The `groupID` stores a single element with highest group id and it updates whenever a new group of synonyms is added. It's made in order to avoid constantly querying the highest group id from `word` table.

## Installation steps and running locally
- git clone https://github.com/gardenrose/synonyms-stuff.git
- navigate to project folder and client folder and run `npm install`
- do the same for server folder and run `npm start` in it. (no need to run client and server separately because of serving a static build. the app runs on port 9000)
