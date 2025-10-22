// 게임 상태 변수
let answer = [];
let attempts = 0;
let isGameOver = false;

// 다국어 지원 함수
function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);

    // data-i18n 속성을 가진 모든 요소 업데이트
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // placeholder 업데이트
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // title 태그 업데이트
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            titleElement.textContent = translations[lang][key];
        }
    }

    // 언어 버튼 active 상태 업데이트
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

// 게임 초기화
function initGame() {
    answer = generateRandomNumber();
    attempts = 0;
    isGameOver = false;
    document.getElementById('attemptCount').textContent = '0';
    document.getElementById('results').innerHTML = '';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    console.log('정답:', answer.join('')); // 개발용 (실제 게임에서는 제거 가능)
}

// 중복 없는 3자리 랜덤 숫자 생성
function generateRandomNumber() {
    const numbers = [];
    while (numbers.length < 3) {
        const num = Math.floor(Math.random() * 10);
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers;
}

// 입력값 검증
function validateInput(input) {
    // 3자리 숫자인지 확인
    if (input.length !== 3) {
        alert(t('alertThreeDigits'));
        return false;
    }

    // 숫자만 입력되었는지 확인
    if (!/^\d{3}$/.test(input)) {
        alert(t('alertNumbersOnly'));
        return false;
    }

    // 중복된 숫자가 있는지 확인
    const digits = input.split('');
    if (new Set(digits).size !== 3) {
        alert(t('alertNoDuplicates'));
        return false;
    }

    return true;
}

// 스트라이크와 볼 계산
function calculateResult(guess) {
    let strikes = 0;
    let balls = 0;

    for (let i = 0; i < 3; i++) {
        const guessDigit = parseInt(guess[i]);

        if (guessDigit === answer[i]) {
            // 숫자와 위치가 모두 맞음
            strikes++;
        } else if (answer.includes(guessDigit)) {
            // 숫자는 맞지만 위치가 틀림
            balls++;
        }
    }

    return { strikes, balls };
}

// 결과 텍스트 생성
function getResultText(strikes, balls) {
    if (strikes === 0 && balls === 0) {
        return t('out');
    }

    let result = [];
    if (strikes > 0) result.push(`${strikes}${t('strike')}`);
    if (balls > 0) result.push(`${balls}${t('ball')}`);

    return result.join(' ');
}

// 결과 표시
function displayResult(guess, strikes, balls) {
    const resultsDiv = document.getElementById('results');
    const resultItem = document.createElement('div');

    if (strikes === 3) {
        resultItem.className = 'result-item success';
    } else {
        resultItem.className = 'result-item';
    }

    resultItem.innerHTML = `
        <span class="result-guess">${guess}</span>
        <span class="result-feedback">${getResultText(strikes, balls)}</span>
    `;

    resultsDiv.insertBefore(resultItem, resultsDiv.firstChild);
}

// 게임 종료 처리
function endGame(won) {
    isGameOver = true;
    document.getElementById('guessInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;

    if (won) {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <h2>${t('gameOverTitle')}</h2>
            <p>${t('gameOverMsg')}</p>
            <p>${t('gameOverAttempts')} ${attempts}${currentLanguage === 'ko' ? '회' : ''}</p>
            <button id="shareBtn" class="share-btn" onclick="shareResult()">
                <span class="share-icon">🔗</span> ${t('shareBtn')}
            </button>
        `;
        document.getElementById('results').insertBefore(gameOverDiv, document.getElementById('results').firstChild);
    }
}

// 결과 공유 함수
function shareResult() {
    const shareText = generateShareText();

    // Web Share API 지원 확인
    if (navigator.share) {
        navigator.share({
            title: t('shareTitle'),
            text: shareText,
            url: window.location.href
        })
        .then(() => {
            console.log('공유 성공');
        })
        .catch((error) => {
            console.log('공유 취소 또는 실패:', error);
            // Web Share API 실패 시 클립보드로 폴백
            copyToClipboard(shareText);
        });
    } else {
        // Web Share API 미지원 시 클립보드에 복사
        copyToClipboard(shareText);
    }
}

// 공유 텍스트 생성
function generateShareText() {
    const attemptText = currentLanguage === 'ko' ? `${attempts}회` : `${attempts} attempts`;
    return `${t('shareText')} ${attemptText}!\n${window.location.href}`;
}

// 클립보드에 복사
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert(t('shareCopied'));
            })
            .catch(() => {
                // Clipboard API 실패 시 폴백
                fallbackCopyToClipboard(text);
            });
    } else {
        // Clipboard API 미지원 시 폴백
        fallbackCopyToClipboard(text);
    }
}

// 클립보드 복사 폴백 함수
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert(t('shareCopied'));
        } else {
            alert(t('shareFailed'));
        }
    } catch (err) {
        alert(t('shareFailed'));
    }

    document.body.removeChild(textArea);
}

// 추측 제출
function submitGuess() {
    if (isGameOver) {
        alert(t('alertGameOver'));
        return;
    }

    const input = document.getElementById('guessInput').value;

    if (!validateInput(input)) {
        return;
    }

    attempts++;
    document.getElementById('attemptCount').textContent = attempts;

    const { strikes, balls } = calculateResult(input);
    displayResult(input, strikes, balls);

    if (strikes === 3) {
        endGame(true);
    } else {
        document.getElementById('guessInput').value = '';
        document.getElementById('guessInput').focus();
    }
}

// 게임 리셋
function resetGame() {
    if (confirm(t('confirmReset'))) {
        initGame();
        document.getElementById('guessInput').focus();
    }
}

// Enter 키로 제출
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 언어 설정 불러오기 또는 기본값 적용
    updateLanguage(currentLanguage);

    // 언어 버튼 이벤트 리스너
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });

    initGame();

    document.getElementById('guessInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });

    // 숫자만 입력되도록 제한
    document.getElementById('guessInput').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
});
