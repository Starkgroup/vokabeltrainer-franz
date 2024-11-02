// scripts.js

let vocabList = [];

// scripts.js

// Function to show the API key modal
function requestApiKey() {
    document.getElementById('modalKey').style.display = 'block';
    document.getElementById('saveApiKey').addEventListener('click', () => {
        const key = document.getElementById('apiKeyInput').value.trim();
        if (key) {
            localStorage.setItem('apiKey', key);
            document.getElementById('modalKey').style.display = 'none';
            requestUserLanguage(); // Proceed to the next modal
        }
    });
}

// Function to show the user language modal
function requestUserLanguage() {
    document.getElementById('modalUserLang').style.display = 'block';
    document.getElementById('saveUserLanguage').addEventListener('click', () => {
        const language = document.getElementById('userLanguageInput').value.trim();
        if (language) {
            localStorage.setItem('userLanguage', language);
            document.getElementById('modalUserLang').style.display = 'none';
            requestTrainingLanguage(); // Proceed to the next modal
        }
    });
}

// Function to show the training language modal
function requestTrainingLanguage() {
    document.getElementById('modalTrainingLang').style.display = 'block';
    document.getElementById('saveTrainingLanguage').addEventListener('click', () => {
        const language = document.getElementById('trainingLanguageInput').value.trim();
        if (language) {
            localStorage.setItem('trainingLanguage', language);
            document.getElementById('modalTrainingLang').style.display = 'none';
            initializeApp(); // Proceed to initialize the app
        }
    });
}

// Check if all necessary data is available
const apiKey = localStorage.getItem('apiKey');
const userLanguage = localStorage.getItem('userLanguage');
const trainingLanguage = localStorage.getItem('trainingLanguage');

if (!apiKey) {
    requestApiKey();
} else if (!userLanguage) {
    requestUserLanguage();
} else if (!trainingLanguage) {
    requestTrainingLanguage();
} else {
    initializeApp();
}

function initializeApp() {
    // Retrieve languages from localStorage
    const userLanguage = localStorage.getItem('userLanguage');
    const trainingLanguage = localStorage.getItem('trainingLanguage');

    // Ensure languages are available
    if (!userLanguage || !trainingLanguage) {
        console.error('Languages not set.');
        return;
    }
    
    // Initiales Laden der Vokabeln
    const storedVocabList = localStorage.getItem('vocabList');
    if (storedVocabList) {
        try {
            vocabList = JSON.parse(storedVocabList);
        } catch (e) {
            console.error('Fehler beim Parsen der Vokabelliste:', e);
            vocabList = [];
        }
    }

    if (!Array.isArray(vocabList) || vocabList.length === 0) {
        vocabList = [
            { word: "Les chiens adorent recevoir des friandises comme récompense.", score: 5 },
            { word: "chien croisé", score: 5 }
        ];
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
    }

    let currentVocab = null;
    let currentTask = '';
    let isAwaitingAnswer = true;

    const taskElement = document.getElementById('task');
    const submitButton = document.getElementById('submitAnswer');
    const nextButton = document.getElementById('nextQuestion');
    const explanationContainer = document.getElementById('explanationContainer');
    const explanationElement = document.getElementById('explanation');
    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', restartTraining);

    // Buttons
    document.getElementById('addVocab').addEventListener('click', addVocab);
    document.getElementById('skipVocab').addEventListener('click', skipVocab);
    submitButton.addEventListener('click', submitAnswer);
    nextButton.addEventListener('click', loadNextQuestion);

    const userForm = document.getElementById('userForm');
    const userAnswerElement = document.getElementById('userAnswer');
    
    userAnswerElement.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey && isAwaitingAnswer) {
            event.preventDefault(); // Verhindert den Zeilenumbruch
            submitAnswer();
    
            // Tastatur auf iOS schließen
            userAnswerElement.blur();
    
            // Alternativ: Fokus auf verstecktes Input setzen
            /*
            const hiddenInput = document.getElementById('hiddenInput');
            hiddenInput.focus();
            hiddenInput.blur();
            */
        }
    });

    userForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Verhindert das Neuladen der Seite
        // Falls nötig, weitere Aktionen hier hinzufügen
    });
    

    loadNextQuestion();

    function getHighScoreVocabs() {
        const maxScore = Math.max(...vocabList.map(v => v.score));
        return vocabList.filter(v => v.score >= maxScore - 2 && v.score >= 1);
    }

    function selectRandomVocab() {
        const highScoreVocabs = getHighScoreVocabs();
        return highScoreVocabs[Math.floor(Math.random() * highScoreVocabs.length)];
    }

    async function loadNextQuestion() {
        userAnswerElement.classList.remove('correct', 'incorrect', 'partial');
        isAwaitingAnswer = true;
        submitButton.style.display = 'inline-block';
        nextButton.style.display = 'none';
        explanationContainer.style.display = 'none';
        userAnswerElement.value = '';

        const highScoreVocabs = getHighScoreVocabs();
        if (highScoreVocabs.length === 0) {
            // Keine Vokabeln mehr zum Üben
            taskElement.textContent = 'Du hast alle Vokabeln erfolgreich gelernt, prima!';
            submitButton.style.display = 'none';
            userAnswerElement.style.display = 'none';
            document.getElementById('skipVocab').style.display = 'none';
            restartButton.style.display = 'inline-block';
            return;
        }

        currentVocab = selectRandomVocab();
        currentTask = await generateTask(currentVocab.word);
        taskElement.innerHTML = currentTask;
    }

    function getHighScoreVocabs() {
        const maxScore = Math.max(...vocabList.map(v => v.score));
        const highScoreVocabs = vocabList.filter(v => v.score >= maxScore - 2 && v.score >= 1);
        return highScoreVocabs;
    }

    function selectRandomVocab() {
        const highScoreVocabs = getHighScoreVocabs();
        if (highScoreVocabs.length === 0) {
            return null;
        }
        return highScoreVocabs[Math.floor(Math.random() * highScoreVocabs.length)];
    }

    function restartTraining() {
        // Prüfe, ob vocabList ein gültiges Array ist
        if (Array.isArray(vocabList)) {
            // Setze die Scores der Vokabeln zurück
            vocabList.forEach(v => v.score = 5);
            localStorage.setItem('vocabList', JSON.stringify(vocabList));
        } else {
            console.error('Vokabelliste ist nicht verfügbar oder ungültig.');
        }

        // Buttons und Felder wieder einblenden
        submitButton.style.display = 'inline-block';
        userAnswerElement.style.display = 'block';
        document.getElementById('skipVocab').style.display = 'inline-block';
        restartButton.style.display = 'none';

        // Nächste Frage laden
        loadNextQuestion();
    }

    async function generateTask(word) {
        const isSentence = /^[A-ZÄÖÜ].*[.!?]$/.test(word);
        let methods = [];
        if (isSentence) {
            methods = [
                `Leave out a difficult vocabulary word (single or compound words) in this sentence: ${word} - Replace the word with '...........' and ask the user in ${userLanguage} to fill in the blank, providing as a hint the ${userLanguage} translation of the missing word. The task should not contain the answer!`,
                `Ask the user in ${userLanguage} for the approximate translation of the sentence from ${userLanguage} into ${trainingLanguage}: "${word}". The task should not contain the answer '${word}'!`
            ];
        } else {
            methods = [
                `The user wants to practice the ${trainingLanguage} vocabulary '${word}'. Create a ${userLanguage} sentence with the translation and formulate in ${userLanguage} a request for the user to translate this sentence into ${trainingLanguage}. The task should not contain the vocabulary '${word}'!`,
                `Formulate in ${userLanguage} a request for the user to translate ${word} from ${trainingLanguage} into ${userLanguage}. The task must contain the word '${word}' (if the word is a noun, use it with the correct ${trainingLanguage} article)!`,
                `Formulate in ${userLanguage} a request for the user to translate the approximate meaning of the ${trainingLanguage} vocabulary '${word}' from ${userLanguage} into ${trainingLanguage}. The task should not contain the answer '${word}'. The task must contain the ${userLanguage} translation as a word!`
            ];
        }
        const method = methods[Math.floor(Math.random() * methods.length)];
    
        const systemPrompt = `The GPT is a helpful and friendly assistant in learning ${trainingLanguage} vocabulary and sentences. GPT always pays attention to correct ${trainingLanguage} articles and other details in grammar, sentence structure, and spelling when evaluating answers. GPT avoids unnecessary phrases like "thank you very much".`;
    
        let response = await callChatGPTAPI(systemPrompt, method);
    
        response = markdownToHTML(response);
    
        return response;
    }
    
    async function submitAnswer() {
        if (!isAwaitingAnswer) return;
        const userAnswer = userAnswerElement.value.trim();
        if (!userAnswer) return;
    
        isAwaitingAnswer = false;
        submitButton.style.display = 'none';
        nextButton.style.display = 'inline-block';
    
        const systemPrompt = `The GPT is a helpful and friendly assistant in helping the user learning ${trainingLanguage} vocabulary and sentences. GPT always pays attention to correct ${trainingLanguage} articles and other details in grammar, sentence structure, and spelling when evaluating answers. The user's native language is ${userLanguage}, so tasks are always formulated in ${userLanguage}.`;
    
        const checkPrompt = `Check the following user answer to the given task and return a JSON with '"correct": true / false / null' and an evaluation for the user in the field "explanation" with text in Markdown format. If the answer is correct, the evaluation can be short and simple but may also include additional usages, information about the origin, or declensions of the word. If the answer is incorrect, explain to the user informally (using "you") how to avoid these mistakes in the future, pointing out correct spellings, easily confusable words, or grammatical connections if necessary. In the evaluation, all ${trainingLanguage} vocabulary or ${trainingLanguage} sentences should be italicized. For small spelling errors (missing letters or missing accents, for example), "correct": null can be returned, but the evaluation should point this out.
    
    Vocabulary: ${currentVocab.word}
    
    Task: ${currentTask}
    
    User's answer: ${userAnswer} - if the user doesn't know the answer, provide detailed assistance. Evaluate errors for the user in a detailed and friendly manner, offering help in deriving the incorrect words or sentences from ${userLanguage} into ${trainingLanguage}. If the user responds approximately correctly but not exactly with ${currentVocab.word}, this should be considered correct. Finally, point out synonyms, antonyms, or related words.`;
    
        const response = await callChatGPTAPI(systemPrompt, checkPrompt);
    
        try {
            const result = JSON.parse(response);
            explanationContainer.style.display = 'block';
            explanationElement.innerHTML = markdownToHTML(result.explanation);
            adjustScore(result.correct);
            enableVocabClick();
    
            userAnswerElement.classList.remove('correct', 'incorrect', 'partial');
    
            if (result.correct === true) {
                userAnswerElement.classList.add('correct');
            } else if (result.correct === false) {
                userAnswerElement.classList.add('incorrect');
            } else if (result.correct === null) {
                userAnswerElement.classList.add('partial');
            }
    
        } catch (e) {
            console.log(response);
            explanationContainer.style.display = 'block';
            explanationElement.textContent = 'Error processing the answer.';
        }
    }
    

    function adjustScore(correct) {
        const vocabIndex = vocabList.findIndex(v => v.word === currentVocab.word);
        if (correct === true) {
            vocabList[vocabIndex].score -= 1;
        } else if (correct === false) {
            vocabList[vocabIndex].score += 1;
        }
        // Score soll zwischen 1 und 10 liegen
        vocabList[vocabIndex].score = Math.max(0, Math.min(10, vocabList[vocabIndex].score));
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
    }

    function skipVocab() {
        const vocabIndex = vocabList.findIndex(v => v.word === currentVocab.word);
        vocabList[vocabIndex].score = 0;
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
        loadNextQuestion();
    }

    function addVocab() {
        const newVocab = prompt('Bitte gib die neue Vokabel oder den Satz auf Französisch ein:');
        if (newVocab) {
            vocabList.push({ word: newVocab.trim(), score: 5 });
            localStorage.setItem('vocabList', JSON.stringify(vocabList));
            alert('Vokabel hinzugefügt!');
        }
    }

    async function callChatGPTAPI(systemPrompt, userPrompt) {
        const apiKey = localStorage.getItem('apiKey');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });
        const data = await response.json();
        let content = data.choices[0].message.content;

        // Entferne ```json oder ``` am Anfang
        content = content.replace(/^```(?:json)?\n?/, '');

        // Entferne ``` am Ende
        content = content.replace(/\n?```$/, '');

        // Ersetze escaped double quotes \" mit unescaped double quotes "
        content = content.replace(/\\"/g, "'");
        content = content.replace(/\\`/g, "'");

        return content;
    }

    function markdownToHTML(markdown) {
        // Konvertiere Fettformatierung (**text**)
        markdown = markdown.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

        // Konvertiere Kursivformatierung (*text* oder _text_)
        markdown = markdown.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

        // Konvertiere nummerierte Listen (1. Item)
        markdown = markdown.replace(/(^|\n)(\d+)\. (.+)/g, function (match, newline, number, item) {
            return `${newline}<ol><li>${item}</li></ol>`;
        });

        // Konvertiere unnummerierte Listen (- Item oder * Item)
        markdown = markdown.replace(/(^|\n)[\*\-] (.+)/g, function (match, newline, item) {
            return `${newline}<ul><li>${item}</li></ul>`;
        });

        // Mehrere Listenelemente zusammenführen
        markdown = markdown.replace(/<\/(ul|ol)>\n<\1>/g, '\n');

        // Zeilenumbrüche in HTML umwandeln
        markdown = markdown.replace(/\n/g, '<br>');

        return markdown;
    }

    function enableVocabClick() {
        const emElements = explanationElement.querySelectorAll('em');
        emElements.forEach(em => {
            em.style.cursor = 'pointer';
            em.addEventListener('click', () => {
                const editedVocab = prompt('Vokabel bearbeiten und hinzufügen:', em.textContent.replace(/['"`]/g, "").trim());
                if (editedVocab) {
                    vocabList.push({ word: editedVocab.trim(), score: 5 });
                    localStorage.setItem('vocabList', JSON.stringify(vocabList));
                    alert('Vokabel hinzugefügt!');
                }
            });
        });
    }
}
