// scripts.js

let vocabList = [];

const apiKey = localStorage.getItem('apiKey');
if (!apiKey) {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('saveApiKey').addEventListener('click', () => {
        const key = document.getElementById('apiKeyInput').value;
        if (key) {
            localStorage.setItem('apiKey', key);
            document.getElementById('modal').style.display = 'none';
            initializeApp();
        }
    });
} else {
    initializeApp();
}

function initializeApp() {
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
    const userAnswerElement = document.getElementById('userAnswer');
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

    userAnswerElement.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            submitAnswer();
        }
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
                `Lasse eine schwierige Vokabel (einzelne oder zusammengesetzte Wörter) in diesem Satz weg: ${word} - Bitte den Nutzer, die Lücke zu füllen und gib als Hinweis die deutsche Übersetzung des in der Lücke fehlenden Wortes. Die Aufgabenstellung darf nicht die Antwort enthalten!`,
                `Frage den Nutzer nach der sinngemäßen Übersetzung des Satzes aus dem Deutschen ins Französische: "${word}". Die Aufgabenstellung darf nicht die Antwort '${word}' enthalten!`
            ];
        } else {
            methods = [
                `Der Nutzer möchte die französische Vokabel '${word}' üben. Bilde einen deutschen Satz mit der Übersetzung und formuliere eine Bitte an den Nutzer, diesen Satz ins Französische zu übersetzen. Die Aufgabenstellung darf nicht die Vokabel '${word}' enthalten!`,
                `Formuliere eine Bitte an den Nutzer, ${word} aus dem Französischen ins Deutsche zu übersetzen. Die Aufgabenstellung muss das Wort '${word}' enthalten (ist das Wort ein Nomen, verwende es mit korrektem französischem Artikel)!`,
                `Formuliere eine Bitte an den Nutzer, die sinngemäße Übersetzung der französischen Vokabel '${word}' aus dem Deutschen ins Französische zu übersetzen. Die Aufgabenstellung darf nicht die Antwort '${word}' enthalten. Die Aufgabenstellung muss die deutsche Übersetzung als Wort enthalten!`
            ];
        }
        const method = methods[Math.floor(Math.random() * methods.length)];

        const systemPrompt = `Das GPT ist ein hilfreicher und freundlicher Unterstützer beim Erlernen französischer Vokabeln und Sätze. Das GPT achtet bei der Auswertung von Antworten immer auf korrekte französische Artikel sowie weitere Details bei Grammatik, Satzbau und Rechtschreibung. Das GPT spart sich unnötige Floskeln wie "vielen Dank"`;

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

        const systemPrompt = `Das GPT ist ein hilfreicher und freundlicher Unterstützer beim Erlernen französischer Vokabeln und Sätze. Das GPT achtet bei der Auswertung von Antworten immer auf korrekte französische Artikel sowie weitere Details bei Grammatik, Satzbau und Rechtschreibung. Aufgaben werden immer auf Deutsch formuliert.`;

        const checkPrompt = `Überprüfe die folgende Antwort des Nutzers auf die gegebene Aufgabe und gib ein JSON zurück mit '"correct": true / false / null' und einer Auswertung für den Nutzer im Feld "explanation" mit Text im Markdown-Format. Ist die Antwort korrekt, kann die Auswertung kurz und einfach erfolgen, aber auch zusätzliche Verwendungen, Informationen zur Herkunft oder Deklinationen des Wortes enthalten. Ist die Antwort falsch, erkläre dem Nutzer informell (per "du"), wie der Nutzer künftig diese Fehler vermeiden kann, weise auf korrekte Schreibweisen, leicht zu verwechselnde Wörter oder grammatikalische Zusammenhänge hin falls nötig. In der Auswertung werden alle französischen Vokabeln oder französischen Sätze schräggestellt. Bei kleinen Rechtschreibfehlern (fehlender Buchstabe oder fehlender accent zum Beispiel) kann "correct": null zurückgegeben werden, aber die Auswerung soll darauf hinweisen.\n\nVokabel: ${currentVocab.word}\n\nAufgabe: ${currentTask}\n\nAntwort des Nutzers: ${userAnswer} - weiß der Nutzer die Antwort nicht, gib ihm eine ausführliche Hilfestellung. Werte Fehler für den Nutzer detailliert und freundlich aus, gib eine Hilfestellung beim herleiten der fehlerhaften Wörter oder Sätze aus dem Deutschen ins Französische. Antwortet der Nutzer sinngemäß richtig, aber nicht genau mit ${currentVocab.word}, ist dies als korrekt auszuwerten. Weise abschließend auf Synonyme, Antonyme oder artverwandte Wörter hin.`;

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
            console.log(response)
            explanationContainer.style.display = 'block';
            explanationElement.textContent = 'Fehler bei der Verarbeitung der Antwort.';
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
