// strip diacritics
function stripDiacritics(str) {
    return str.normalize('NFD').replace(/[̀-\u036f]/g, '');
}

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('search-input');
    const resultsEl = document.getElementById('search-results');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');

    searchBtn.addEventListener('click', () => {
        const raw = inputEl.value.trim().toLowerCase();
        const txt = stripDiacritics(raw);
        resultsEl.innerHTML = '';
        if (!txt) {
            resultsEl.innerHTML = '<em>Introdu text pentru căutare.</em>';
            return;
        }
        const matches = allQuestions.filter(q => {
            const cand = stripDiacritics(q.question.toLowerCase());
            return cand.includes(txt);
        });
        if (!matches.length) {
            resultsEl.innerHTML = '<em>Nu s-au găsit întrebări.</em>';
            return;
        }
        matches.forEach((q, i) => {
            const block = document.createElement('div');
            block.style.marginBottom = '20px';
            const p = document.createElement('p');
            p.innerHTML = `<strong>${i+1}. ${q.question}</strong>`;
            block.appendChild(p);
            const correct = Array.isArray(q.correctIndexes)
                ? q.correctIndexes : [q.correctIndexes];
            const ul = document.createElement('ul');
            correct.forEach(ci => {
                const li = document.createElement('li');
                li.innerText = q.answers[ci];
                ul.appendChild(li);
            });
            block.appendChild(ul);
            resultsEl.appendChild(block);
        });
    });

    clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        resultsEl.innerHTML = '';
        inputEl.focus();
    });
});