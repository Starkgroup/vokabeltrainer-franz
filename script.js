// script.js

let vocabList = [];
let currentVocab = null;
let currentTask = '';
let isAwaitingAnswer = true;

// Variables for DOM elements
let taskElement;
let submitButton;
let nextButton;
let explanationContainer;
let explanationElement;
let restartButton;
let userForm;
let userAnswerElement;

// Text content for UI elements
let uiText = {
    welcomeMessage: 'Welcome',
    loadingTask: 'Loading task...',
    yourAnswerPlaceholder: 'Your answer',
    reviewAnswerButton: 'Review my answer',
    nextTaskButton: 'Next task, please',
    addVocabAlt: 'Add Vocabulary',
    skipVocabAlt: 'Remove from vocabulary training list',
    restartButtonAlt: 'Reset the vocabulary training list',
    addVocabPrompt: 'Please enter the new vocabulary or sentence:',
    addVocabSuccess: 'Vocabulary added!',
    enterAllVocabPrompt: 'Please enter all three vocabulary items to start.',
    learnedAllVocab: 'You have successfully learned all vocabularies, great job!',
    modal: {
        apiKeyRequired: 'API Key Required',
        enterApiKey: 'Please enter your OpenAI API key:',
        saveButton: 'Save',
        enterNativeLanguage: 'What is your native language?',
        enterNativeLanguagePlaceholder: 'For example: German',
        enterTrainingLanguage: 'Which language do you want to learn?',
        enterTrainingLanguagePlaceholder: 'For example: French',
        addFirstVocab: 'Add Your First Vocabularies',
        enterFirstThreeVocab: 'Please enter your first three vocabulary items in the language you are learning:',
        enterVocabPlaceholder: 'Enter vocabulary'
    }
};

// Function to translate UI text
async function translateUIText(targetLanguage) {
    const apiKey = localStorage.getItem('apiKey');
    const textToTranslate = JSON.stringify(uiText);

    const systemPrompt = 'You are a helpful assistant that translates JSON objects containing UI text into the target language while preserving the JSON structure.';
    const userPrompt = `Translate the following JSON object into ${targetLanguage}. Preserve the JSON structure and keys. Do not translate any keys, only the values.

JSON to translate:
${textToTranslate}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    const data = await response.json();
    let translatedText = data.choices[0].message.content;

    // Clean up the response to get valid JSON
    translatedText = translatedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    try {
        uiText = JSON.parse(translatedText);
        // Store the translated UI text in localStorage with the language as a key
        localStorage.setItem(`uiText_${targetLanguage}`, JSON.stringify(uiText));
    } catch (e) {
        console.error('Error parsing translated UI text:', e);
    }
}

// Function to update UI elements with translated text
function updateUIElements() {
    document.querySelector('header h1').textContent = uiText.welcomeMessage;
    taskElement.textContent = uiText.loadingTask;
    userAnswerElement.placeholder = uiText.yourAnswerPlaceholder;
    submitButton.textContent = uiText.reviewAnswerButton;
    nextButton.textContent = uiText.nextTaskButton;
    document.getElementById('addVocab').alt = uiText.addVocabAlt;
    document.getElementById('skipVocab').alt = uiText.skipVocabAlt;
    restartButton.alt = uiText.restartButtonAlt;

    // Update modals
    document.getElementById('modalKey').querySelector('h2').textContent = uiText.modal.apiKeyRequired;
    document.getElementById('modalKey').querySelector('p').textContent = uiText.modal.enterApiKey;
    document.getElementById('apiKeyInput').placeholder = uiText.modal.enterApiKey;
    document.getElementById('saveApiKey').textContent = uiText.modal.saveButton;

    document.getElementById('modalUserLang').querySelector('h2').textContent = uiText.modal.enterNativeLanguage;
    document.getElementById('modalUserLang').querySelector('p').textContent = uiText.modal.enterNativeLanguage;
    document.getElementById('userLanguageInput').placeholder = uiText.modal.enterNativeLanguagePlaceholder;
    document.getElementById('saveUserLanguage').textContent = uiText.modal.saveButton;

    document.getElementById('modalTrainingLang').querySelector('h2').textContent = uiText.modal.enterTrainingLanguage;
    document.getElementById('modalTrainingLang').querySelector('p').textContent = uiText.modal.enterTrainingLanguage;
    document.getElementById('trainingLanguageInput').placeholder = uiText.modal.enterTrainingLanguagePlaceholder;
    document.getElementById('saveTrainingLanguage').textContent = uiText.modal.saveButton;

    document.getElementById('modalFirstVocab').querySelector('h2').textContent = uiText.modal.addFirstVocab;
    document.getElementById('modalFirstVocab').querySelector('p').textContent = uiText.modal.enterFirstThreeVocab;
    document.getElementById('firstVocabInput1').placeholder = uiText.modal.enterVocabPlaceholder;
    document.getElementById('firstVocabInput2').placeholder = uiText.modal.enterVocabPlaceholder;
    document.getElementById('firstVocabInput3').placeholder = uiText.modal.enterVocabPlaceholder;
    document.getElementById('saveFirstVocab').textContent = uiText.modal.saveButton;
}

// Function to show the API key modal
function requestApiKey() {
    document.getElementById('modalKey').style.display = 'block';
    document.getElementById('saveApiKey').addEventListener('click', async () => {
        const key = document.getElementById('apiKeyInput').value.trim();
        if (key) {
            localStorage.setItem('apiKey', key);
            document.getElementById('modalKey').style.display = 'none';
            requestUserLanguage();
        }
    });
}

// Function to show the user language modal
function requestUserLanguage() {
    document.getElementById('modalUserLang').style.display = 'block';
    document.getElementById('saveUserLanguage').addEventListener('click', async () => {
        const language = document.getElementById('userLanguageInput').value.trim();
        if (language) {
            localStorage.setItem('userLanguage', language);
            document.getElementById('modalUserLang').style.display = 'none';

            // Check if the translated UI text is already in localStorage
            const storedUIText = localStorage.getItem(`uiText_${language}`);
            if (storedUIText) {
                uiText = JSON.parse(storedUIText);
                updateUIElements();
            } else {
                // Translate UI text and store it
                await translateUIText(language);
                updateUIElements();
            }

            requestTrainingLanguage();
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
            initializeApp();
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

async function initializeApp() {
    // Retrieve languages from localStorage
    const userLanguage = localStorage.getItem('userLanguage');
    const trainingLanguage = localStorage.getItem('trainingLanguage');

    // Ensure languages are available
    if (!userLanguage || !trainingLanguage) {
        console.error('Languages not set.');
        return;
    }

    // Initialize DOM elements
    taskElement = document.getElementById('task');
    submitButton = document.getElementById('submitAnswer');
    nextButton = document.getElementById('nextQuestion');
    explanationContainer = document.getElementById('explanationContainer');
    explanationElement = document.getElementById('explanation');
    restartButton = document.getElementById('restartButton');
    userForm = document.getElementById('userForm');
    userAnswerElement = document.getElementById('userAnswer');

    // Check if the translated UI text is already in localStorage
    const storedUIText = localStorage.getItem(`uiText_${userLanguage}`);
    if (storedUIText) {
        uiText = JSON.parse(storedUIText);
        updateUIElements();
    } else {
        if (userLanguage !== 'English') {
            await translateUIText(userLanguage);
            updateUIElements();
        }
    }

    loadVocabList();

    if (!Array.isArray(vocabList) || vocabList.length === 0) {
        promptInitialVocabularies();
    } else {
        setupEventListeners();
        loadNextQuestion();
    }
}

function loadVocabList() {
    const storedVocabList = localStorage.getItem('vocabList');
    if (storedVocabList) {
        try {
            vocabList = JSON.parse(storedVocabList);
        } catch (e) {
            console.error('Error parsing vocabulary list:', e);
            vocabList = [];
        }
    } else {
        vocabList = [];
    }
}

function promptInitialVocabularies() {
    document.getElementById('modalFirstVocab').style.display = 'block';

    // Remove any previous event listeners to prevent duplicates
    const saveButton = document.getElementById('saveFirstVocab');
    saveButton.replaceWith(saveButton.cloneNode(true));
    document.getElementById('saveFirstVocab').addEventListener('click', () => {
        const vocab1 = document.getElementById('firstVocabInput1').value.trim();
        const vocab2 = document.getElementById('firstVocabInput2').value.trim();
        const vocab3 = document.getElementById('firstVocabInput3').value.trim();
        if (vocab1 && vocab2 && vocab3) {
            vocabList.push({ word: vocab1, score: 5 });
            vocabList.push({ word: vocab2, score: 5 });
            vocabList.push({ word: vocab3, score: 5 });
            localStorage.setItem('vocabList', JSON.stringify(vocabList));
            document.getElementById('modalFirstVocab').style.display = 'none';
            setupEventListeners();
            loadNextQuestion();
        } else {
            alert(uiText.enterAllVocabPrompt);
        }
    });
}

function setupEventListeners() {
    restartButton.addEventListener('click', restartTraining);
    document.getElementById('addVocab').addEventListener('click', addVocab);
    document.getElementById('skipVocab').addEventListener('click', skipVocab);
    submitButton.addEventListener('click', submitAnswer);
    nextButton.addEventListener('click', loadNextQuestion);

    userAnswerElement.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey && isAwaitingAnswer) {
            event.preventDefault();
            submitAnswer();
            userAnswerElement.blur();
        }
    });

    userForm.addEventListener('submit', function(event) {
        event.preventDefault();
    });
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
        taskElement.textContent = uiText.learnedAllVocab;
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
    return vocabList.filter(v => v.score >= maxScore - 2 && v.score >= 1);
}

function selectRandomVocab() {
    const highScoreVocabs = getHighScoreVocabs();
    if (highScoreVocabs.length === 0) {
        return null;
    }
    return highScoreVocabs[Math.floor(Math.random() * highScoreVocabs.length)];
}

function restartTraining() {
    if (Array.isArray(vocabList)) {
        vocabList.forEach(v => v.score = 5);
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
    } else {
        console.error('Vocabulary list is not available or invalid.');
    }

    submitButton.style.display = 'inline-block';
    userAnswerElement.style.display = 'block';
    document.getElementById('skipVocab').style.display = 'inline-block';
    restartButton.style.display = 'none';

    loadNextQuestion();
}

async function generateTask(word) {
    const userLanguage = localStorage.getItem('userLanguage');
    const trainingLanguage = localStorage.getItem('trainingLanguage');

    const isSentence = /^[A-ZÄÖÜ].*[.!?]$/.test(word);
    let methods = [];
    if (isSentence) {
        methods = [
            `Leave out a difficult vocabulary word (single or compound words) in this sentence: ${word} - Replace the word with '...........' and ask the user in ${userLanguage} to fill in the blank, providing as a hint the ${userLanguage} translation of the missing word. The task should not contain the answer!`,
            `Ask the user in ${userLanguage} for the approximate translation of the sentence from ${trainingLanguage} into ${userLanguage}: "${word}". The task should not contain the answer '${word}'!`
        ];
    } else {
        methods = [
            `The user wants to practice the ${trainingLanguage} vocabulary '${word}'. Create a ${userLanguage} sentence with the translation and formulate in ${userLanguage} a request for the user to translate this sentence into ${trainingLanguage}. The task should not contain the vocabulary '${word}'!`,
            `Formulate in ${userLanguage} a request for the user to translate '${word}' from ${trainingLanguage} into ${userLanguage}. The task must contain the word '${word}' (if the word is a noun, use it with the correct ${trainingLanguage} article)!`,
            `Formulate in ${userLanguage} a request for the user to translate the approximate meaning of the ${trainingLanguage} vocabulary '${word}' from ${userLanguage} into ${trainingLanguage}. The task should not contain the answer '${word}'. The task must contain the ${userLanguage} translation as a word!`
        ];
    }
    const method = methods[Math.floor(Math.random() * methods.length)];

    const systemPrompt = `The assistant is a helpful and friendly supporter in learning ${trainingLanguage} vocabulary and sentences. The assistant always pays attention to correct ${trainingLanguage} articles and other details in grammar, sentence structure, and spelling when evaluating answers. The assistant avoids unnecessary phrases like "thank you very much".`;

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

    const userLanguage = localStorage.getItem('userLanguage');
    const trainingLanguage = localStorage.getItem('trainingLanguage');

    const systemPrompt = `The assistant is a helpful and friendly supporter in helping the user learn ${trainingLanguage} vocabulary and sentences. The assistant always pays attention to correct ${trainingLanguage} articles and other details in grammar, sentence structure, and spelling when evaluating answers. The user's native language is ${userLanguage}, so tasks are always formulated in ${userLanguage}.`;

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
    const newVocab = prompt(uiText.addVocabPrompt);
    if (newVocab) {
        vocabList.push({ word: newVocab.trim(), score: 5 });
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
        alert(uiText.addVocabSuccess);
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
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });
    const data = await response.json();
    let content = data.choices[0].message.content;

    content = content.replace(/^```(?:json)?\n?/, '');
    content = content.replace(/\n?```$/, '');
    content = content.replace(/\\"/g, "'");
    content = content.replace(/\\`/g, "'");

    return content;
}

function markdownToHTML(markdown) {
    markdown = markdown.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    markdown = markdown.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    markdown = markdown.replace(/(^|\n)(\d+)\. (.+)/g, function (match, newline, number, item) {
        return `${newline}<ol><li>${item}</li></ol>`;
    });
    markdown = markdown.replace(/(^|\n)[\*\-] (.+)/g, function (match, newline, item) {
        return `${newline}<ul><li>${item}</li></ul>`;
    });
    markdown = markdown.replace(/<\/(ul|ol)>\n<\1>/g, '\n');
    markdown = markdown.replace(/\n/g, '<br>');
    return markdown;
}

function enableVocabClick() {
    const emElements = explanationElement.querySelectorAll('em');
    emElements.forEach(em => {
        em.style.cursor = 'pointer';
        em.addEventListener('click', () => {
            const editedVocab = prompt(uiText.addVocabPrompt, em.textContent.replace(/['"`]/g, "").trim());
            if (editedVocab) {
                vocabList.push({ word: editedVocab.trim(), score: 5 });
                localStorage.setItem('vocabList', JSON.stringify(vocabList));
                alert(uiText.addVocabSuccess);
            }
        });
    });
}
