let currentIndex = 0;
let shuffledQuestions = [];
let userAnswers = [];
let currentTestKey = null;

document.addEventListener("DOMContentLoaded", () => {
    // Dacă există teste generate anterior, le afișăm
    const modele = JSON.parse(localStorage.getItem("modele_generate") || "[]");
    if (modele.length) {
        afiseazaModele(modele);
    }

    document.getElementById("genereaza").addEventListener("click", genereazaModele);

    // În cazul unui test în desfășurare, oferim opțiunea de continuare
    const testKey = localStorage.getItem("test_id");
    const testJson = localStorage.getItem("test_curent");
    const testIndex = parseInt(localStorage.getItem("test_index")) || 0;
    const finalizat = testKey && localStorage.getItem(testKey + "_finalizat") === "da";
    if (testKey && testJson && !finalizat && testIndex < JSON.parse(testJson).length) {
        const continua = confirm("Ai un test în desfășurare. Vrei să continui?");
        if (continua) {
			currentTestKey = testKey;
            startQuiz(JSON.parse(testJson), testIndex);
        } else {
            // Ștergem datele testului curent
            localStorage.removeItem("test_id");
            localStorage.removeItem("test_curent");
            localStorage.removeItem("test_index");
        }
    }
});

function genereazaModele() {
	//  Curăță vechile teste din localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith("test_")) {
            localStorage.removeItem(key);
        }
    }
    // ————————————————
	// Amestec și fragmentare în teste de câte 45 întrebări
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const tests = [];
    for (let i = 0; i < shuffled.length; i += 45) {
        tests.push(shuffled.slice(i, i + 45));
    }
    localStorage.setItem("modele_generate", JSON.stringify(tests));
    afiseazaModele(tests);
}

function afiseazaModele(tests) {
    const container = document.getElementById("teste-generate");
    container.innerHTML = "<h3>Teste generate:</h3>";
    tests.forEach((test, index) => {
        const btn = document.createElement("button");
        btn.innerHTML = `📝 Testul ${index + 1}`;
        btn.style.margin = "5px";
        btn.style.padding = "10px";
        btn.onclick = () => {
            const testKey = `test_${index}`;
			currentTestKey = testKey;
            const testJson = JSON.stringify(test);
            const finalizat = localStorage.getItem(testKey + "_finalizat") === "da";

            // Salvăm întotdeauna lista de teste și meta-informațiile curente
            localStorage.setItem("modele_generate", JSON.stringify(tests));
            localStorage.setItem("test_id", testKey);
            localStorage.setItem("test_curent", testJson);

            if (finalizat) {
                // Dacă testul a fost finalizat, afișăm raportul salvat
                currentIndex = test.length;
                shuffledQuestions = [...test];
                userAnswers = JSON.parse(localStorage.getItem(testKey + "_raspunsuri") || "[]");
                document.getElementById("main-menu").style.display = "none";
                document.getElementById("quiz").style.display = "block";
                showResults();
            } else {
                // Test nou: resetăm starea de răspunsuri
                localStorage.setItem("test_index", 0);
                localStorage.removeItem(testKey + "_raspunsuri");
                localStorage.removeItem(testKey + "_raspunsuri_partial");
                userAnswers = [];
                startQuiz(test, 0);
            }
        };
        container.appendChild(btn);
    });
}

function startQuiz(test, idx = 0) {
    currentTestKey = localStorage.getItem("test_id");
    shuffledQuestions = test;
    currentIndex = idx;
    userAnswers = JSON.parse(localStorage.getItem(currentTestKey + "_raspunsuri_partial") || "[]");
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    document.getElementById("rezultat").style.display = "none";
    loadNextQuestion();
}

function loadNextQuestion() {
    document.getElementById("feedback").innerText = "";
    const nextBtn = document.getElementById("next-button");
    nextBtn.disabled = false;
    nextBtn.innerText = "Următoarea întrebare";
    nextBtn.onclick = handleAnswer;

    if (currentIndex >= shuffledQuestions.length) {
        showResults();
        return;
    }

    const question = shuffledQuestions[currentIndex];
    document.getElementById("question").innerText = `Întrebarea ${currentIndex + 1} din ${shuffledQuestions.length}\n\n${question.question}`;
    const optionsDiv = document.getElementById("answers");
    optionsDiv.innerHTML = "";

    question.answers.forEach((opt, idx) => {
        const label = document.createElement("label");
        label.style.display = "block";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "answer";
        input.value = idx;
        input.style.marginRight = "10px";
        // Restaurăm starea bifărilor dacă reluăm
        if (userAnswers[currentIndex] && userAnswers[currentIndex].includes(idx)) {
            input.checked = true;
        }
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        optionsDiv.appendChild(label);
    });
}

function handleAnswer() {
    const selected = Array.from(document.querySelectorAll('input[name="answer"]:checked')).map(i => parseInt(i.value));
    userAnswers[currentIndex] = selected;
    // Salvăm răspunsurile parțiale pentru reluare
    localStorage.setItem(currentTestKey + "_raspunsuri_partial", JSON.stringify(userAnswers));
    currentIndex++;
    localStorage.setItem("test_index", currentIndex);
    loadNextQuestion();
}

function showResults() {
    // Salvăm definitiv răspunsurile și marcăm testul ca finalizat
    localStorage.setItem(currentTestKey + "_raspunsuri", JSON.stringify(userAnswers));
    localStorage.setItem(currentTestKey + "_finalizat", "da");
    localStorage.removeItem(currentTestKey + "_raspunsuri_partial");
	
	// Calculăm scorul: câte întrebări ai nimerit pe deplin
    const total = shuffledQuestions.length;
    let corecteComplet = 0;
    shuffledQuestions.forEach((q, idx) => {
        const corecte = Array.isArray(q.correctIndexes)
            ? q.correctIndexes.slice().sort()
            : [q.correctIndexes];
        const rasp = (userAnswers[idx]||[]).slice().sort();
        // comparăm exact egalitate de mulțimi
        if (corecte.length === rasp.length &&
            corecte.every((v,i) => v === rasp[i])) {
            corecteComplet++;
        }
    });
	const nota = corecteComplet*0.2 + 1;

    // Afișăm raportul
    document.getElementById("quiz").style.display = "none";
    const container = document.getElementById("rezultat");
	container.innerHTML = `
		<h2>Rezultate finale</h2>
		<br>
		<p><strong>Ai răspuns complet corect la ${corecteComplet} din ${total} întrebări.</strong></p>
		<p><strong>Nota: ${nota}</strong></p>
	`;
    container.style.display = "block";

	// Afișăm detaliile fiecărei întrebări
    shuffledQuestions.forEach((q, idx) => {
        const block = document.createElement("div");
        block.style.marginBottom = "20px";
        const correct = Array.isArray(q.correctIndexes) ? q.correctIndexes : [q.correctIndexes];
        const userAns = userAnswers[idx] || [];
        const title = document.createElement("p");
        title.innerHTML = `<strong>${idx + 1}. ${q.question}</strong>`;
        block.appendChild(title);
        q.answers.forEach((opt, i) => {
            const p = document.createElement("p");
            const wasChecked = userAns.includes(i);
            const isCorrect = correct.includes(i);
            let prefix = "";
            if (wasChecked && isCorrect) { prefix = "✅ "; p.style.color = "green"; }
            else if (wasChecked && !isCorrect) { prefix = "❌ "; p.style.color = "red"; }
            else if (!wasChecked && isCorrect) { prefix = "✔️ "; p.style.color = "blue"; }
            else { prefix = "⬜ "; }
            p.innerText = prefix + opt;
            block.appendChild(p);
        });
        container.appendChild(block);
    });

    // Buton de reîncepere
    const restart = document.createElement("button");
    restart.textContent = "Reia testul";
    restart.onclick = () => {
        localStorage.removeItem(currentTestKey + "_raspunsuri");
        localStorage.removeItem(currentTestKey + "_finalizat");
        localStorage.removeItem(currentTestKey + "_raspunsuri_partial");
        localStorage.setItem("test_index", 0);
        startQuiz(shuffledQuestions, 0);
    };
    container.appendChild(restart);

    // Buton de întoarcere la lista de teste
    const back = document.createElement("button");
    back.textContent = "Modele generate";
    back.style.marginLeft = "10px";
    back.onclick = () => {
        container.style.display = "none";
        document.getElementById("quiz").style.display = "none";
        document.getElementById("main-menu").style.display = "block";
        const tests = JSON.parse(localStorage.getItem("modele_generate") || "[]");
        afiseazaModele(tests);
    };
    container.appendChild(back);
}