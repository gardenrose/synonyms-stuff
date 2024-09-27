import React, { useState, useEffect } from "react";
import './styles.css';
import { Link } from "react-router-dom";
import {INVALID_INPUT_WARNING, CONFLICTING_INPUT_WARNING, REPEATING_SYNONYM_WARNING, INSERT_SUCCESSFUL} from './constants'
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function CreateWord() {
    // since this form is used for both adding completely new words and
    // adding new synonyms for existing words, it uses location to check 
    // if anything was passed. When something new was added, regardless if
    // it's synonym or entirely new word with synonyms, it will go back to 
    // that state on home page.
    const navigate = useNavigate();
    const location = useLocation();
    const { passedWord, passedSynonyms, passedGroupId } = location.state || { passedWord: "", passedSynonyms: [], passedGroupId: null };
    const [mainWord, setMainWord] = useState(passedWord || '');
    const [synonyms, setSynonyms] = useState([...passedSynonyms, '', '']); 
    const [warning, setWarning] = useState(null);


    // enable 2 input fields for new synonyms. 
    // Possible to add more by clicking button.
    useEffect(() => {
        if (passedWord) {
          setMainWord(passedWord);
        }
        if (passedSynonyms.length > 0) {
          setSynonyms([...passedSynonyms, '', '']);
        }
      }, [passedWord, passedSynonyms]);
    
      const addSynonymInput = () => {
        setSynonyms([...synonyms, '', '']); 
      };

  
  const handleSynonymChange = (index, value) => {
    const newSynonyms = [...synonyms];
    newSynonyms[index] = value;
    setSynonyms(newSynonyms);
  };


  const handleSave = async () => {
    setWarning(null);

    const existingSynonyms = passedSynonyms.map(synonym => synonym.toLowerCase());

    // when entering a new word with synonyms, these filters will make sure
    // to remove anything that is repeated or empty. Also, all words will be in lowercase
    const newSynonyms = synonyms
      .slice(passedSynonyms.length)
      .filter(synonym => synonym.trim() !== '');

    const validNewSynonyms = newSynonyms.filter(synonym => {
      const lowerSynonym = synonym.toLowerCase();
      return lowerSynonym !== mainWord.toLowerCase() && !existingSynonyms.includes(lowerSynonym);
    });

    const uniqueValidNewSynonyms = [...new Set(validNewSynonyms.map(synonym => synonym.toLowerCase()))];

    // If all entered synonyms are empty/repeated, there is no need to make an API call
    // But if even 1 valid synonym is found, it will be inserted, regardless of invalid ones.
    const allNewSynonymsInvalid = newSynonyms.every(synonym => {
      const lowerSynonym = synonym.toLowerCase();
      return existingSynonyms.includes(lowerSynonym) || lowerSynonym === mainWord.toLowerCase();
    });

    if (allNewSynonymsInvalid) {
      setWarning(REPEATING_SYNONYM_WARNING);
      return;
    }

    const allData = {
      mainWord,
      synonyms: uniqueValidNewSynonyms,
      groupId: passedSynonyms.length > 0 ? passedGroupId : undefined,
    };

    // try to insert words and based on response either show
    // warning or notification (and in case of a notification)
    // navigate back to home page. 
    if (allData.mainWord.trim()) {
      try {
        const response = await fetch('https://synonyms-stuff-api.vercel.app/api/insertWord', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(allData),
        });

        if (response.ok) {
          const message = await response.text();
          console.log(message);

          setWarning(INSERT_SUCCESSFUL);
          setTimeout(() => {
            navigate("/", { state: { searchWord: mainWord } }); 
          }, 1000);
        } else {
          setWarning(CONFLICTING_INPUT_WARNING);
          const errorMessage = await response.text();
          console.error(errorMessage);
        }
      } catch (error) {
        console.error("Error during API call:", error);
      }
    } else {
      setWarning(INVALID_INPUT_WARNING);
    }
  };

  // the input fields should be disabled if main word and synonyms were passed
  // in order to see what words already exist in the synonym group and avoid
  // inserting them. But even if they are inserted, they will be filtered in
  // handleSave() function, all new words will be compared to existing ones.
  return (
    <div align="center">
      <h1>Create a word with synonym(s)</h1>
      <label>Word or expression: </label>
      {/* Main word here doesn't have specific meaning and does not differentiate from existing synonyms
      so this could have been made without isolating it in separate input field. So the primary purpose
      of the main word is to help the user remember which word he was looking up and wanted to create synonyms for.  */}
      <input disabled={!!passedWord && passedSynonyms.length > 0} value={mainWord} className="insertword" onChange={(e) => setMainWord(e.target.value)}/>
      <br/><br/>
      <div className="insertwrapper">
        {synonyms.map((synonym, index) => (
          <div key={index} className="synonyminput">
            <br/>
            <label>Synonym: </label>
            <input 
              className="insertword"
              value={synonym} 
              disabled={index < passedSynonyms.length}
              onChange={(e) => handleSynonymChange(index, e.target.value)} 
            />
          </div>
        ))}
      </div>
      <br/>
      <button className="managebtn" onClick={addSynonymInput}>
        + Add Synonym
      </button>
      &nbsp;&nbsp;
      <button className="managebtn"  onClick={handleSave}>
        Save
      </button>
      &nbsp;&nbsp;
      <Link to="/">
          <button className="managebtn">Cancel</button>
        </Link>
        {warning && <p className={`${warning === INSERT_SUCCESSFUL ? 'notification' : 'warning'}`}>{warning}</p>}

    </div>
  );
}

export default CreateWord;
