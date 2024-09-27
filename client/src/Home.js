import React, { useState, useEffect } from "react";
import "./styles.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { NO_SYNONYMS } from "./constants";

function Home() {
  // main word is what user searches for, and word groups is an array
  // in case that there's more that 1 word which is written the same
  // but has different meaning and synonyms. In that case, user sees
  // both groups for a word, and first 4 synonyms of each and needs
  // to choose one to lookup its synonyms. E.g. the word bear can mean
  // an animal or a verb to suffer/carry... and belongs to 2 groups.

  const location = useLocation();
  const [mainWord, setMainWord] = useState("");
  const [wordGroups, setWordGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // In case a new word was inserted and it was navigated to this page.
  // The user will then see the word with a list of its synonyms.
  useEffect(() => {
    const searchWord = location.state?.searchWord;
    if (searchWord) {
      setMainWord(searchWord);
      searchForSynonym(searchWord);
    }
  }, [location.state]);

  // search for synonyms of the entered word/expression by making an API call.
  // Filter them to only those who atleast have 1 synonym, in case there is
  // a word without synonyms in db (though it cannot happen through the app,
  // only by manually adding to db, the app doesn't allow entering a single
  // word without any synonym.). Search is case insensitive.
  function searchForSynonym(word) {
    setSelectedGroup(null);
    const input = word || document.getElementById("searchbar").value;
    const lowerCaseInput = input.toLowerCase();
    if (lowerCaseInput !== "") {
      setMainWord(lowerCaseInput);
      fetch(`synonyms-stuff-api.vercel.app/api/getSynonyms?name=${lowerCaseInput}`)
        .then((response) => response.json())
        .then((data) => {
          const filteredWordGroups = data.matchedWords.filter(
            (group) => group.synonyms && group.synonyms.length > 0
          );
          setWordGroups(filteredWordGroups);
        })
        .catch((error) => {
          console.error("Error fetching synonyms:", error);
        });
    }
  }

  // User can press enter when searching
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      searchForSynonym();
    }
  };

  return (
    <div>
      <div className="searchwrapper">
        <Link to="/create">
          <button className="managebtn">Add new word</button>
        </Link>
        &nbsp;
        <input
          placeholder="Search for a word..."
          className="searchbar"
          id="searchbar"
          onKeyPress={handleKeyPress} // deprecated but works
        ></input>
        <button className="searchbtn" onClick={() => searchForSynonym()}>
          🔎
        </button>
      </div>
      <br />
      {/* If multiple groups are found for a word, the user needs to select one to see all its synonyms */}
      {mainWord !== "" && (
        <div>
          {wordGroups.length > 1 ? (
            selectedGroup ? (
              <div>
                <div className="mainwordwrapper">
                  <h1 className="mainword">{selectedGroup.word}</h1>
                </div>
                <hr />
                {selectedGroup.synonyms.map((synonym) => {
                  return (
                    <div>
                      <p
                        className="synonym"
                        onClick={() => searchForSynonym(synonym)}
                      >
                        <u>{synonym}</u>
                      </p>
                    </div>
                  );
                })}
                {/* Pass the word, its synonyms and group id in case of adding synonyms to existing word. */}
                <Link
                  to="/create"
                  state={{
                    passedWord: mainWord,
                    passedSynonyms: selectedGroup ? selectedGroup.synonyms : [],
                    passedGroupId: selectedGroup ? selectedGroup.group : null,
                  }}
                >
                  <button className="managebtn addsynonym">Add synonym</button>
                </Link>
              </div>
            ) : (
              wordGroups.map((group) => {
                const synonymsList = group.synonyms.slice(0, 4);
                return (
                  <div key={group.word} className="mainwordwrapper">
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid*/}
                    <h1
                      className="mainword clickableword"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <u>{group.word}</u>
                    </h1>
                    <span>
                      {synonymsList.length > 0
                        ? `(${synonymsList.join(", ")})`
                        : `(${NO_SYNONYMS})`}
                    </span>
                    <div></div>
                  </div>
                );
              })
            )
          ) : wordGroups.length > 0 && wordGroups[0].synonyms.length > 0 ? (
            <div>
              <div className="mainwordwrapper">
                <h1 className="mainword">{mainWord}</h1>
              </div>
              <hr />
              {wordGroups[0].synonyms.map((synonym) => {
                return (
                  <p
                    className="synonym"
                    onClick={() => searchForSynonym(synonym)}
                  >
                    <u>{synonym}</u>
                  </p>
                );
              })}
            </div>
          ) : (
            <div>
              <h1 className="mainword">{mainWord}</h1>
              <hr />
              <p>No synonyms available.</p>
            </div>
          )}
          {wordGroups.length < 2 ? (
            <>
              <br />
              <Link
                to="/create"
                state={{
                  passedWord: mainWord,
                  passedSynonyms:
                    wordGroups.length > 0 ? wordGroups[0].synonyms : [],
                  passedGroupId:
                    wordGroups.length > 0 ? wordGroups[0].group : null,
                }}
              >
                <button className="managebtn addsynonym">Add synonym</button>
              </Link>
            </>
          ) : (
            <></>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
