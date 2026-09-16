/* =========================================================
   GB4839 农药英语学习助手
   单词 + 分页 + 收藏 + 跳过 + 间隔复习
========================================================= */


/* =========================================================
   基础数据
========================================================= */

let allWords = [];

let displayedWords = [];

let currentPage = 1;

const PAGE_SIZE = 30;

let currentLetter = "ALL";

let currentMode = "all";

let studyMode = false;


/* =========================================================
   DOM
========================================================= */

const wordList =
    document.getElementById("wordList");

const searchInput =
    document.getElementById("searchInput");

const alphabet =
    document.getElementById("alphabet");

const totalCount =
    document.getElementById("totalCount");

const resultCount =
    document.getElementById("resultCount");

const reviewCount =
    document.getElementById("reviewCount");

const favoriteCount =
    document.getElementById("favoriteCount");

const difficultCount =
    document.getElementById("difficultCount");

const skippedCount =
    document.getElementById("skippedCount");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const pageInfo =
    document.getElementById("pageInfo");

const modeMessage =
    document.getElementById("modeMessage");


/* =========================================================
   学习记录
========================================================= */

const STORAGE_KEY =
    "pesticideEnglishLearningV1";


function getStudyData() {

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};

    } catch {

        return {};
    }
}


let studyData = getStudyData();


function saveStudyData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(studyData)
    );

    updateStats();
}


/* =========================================================
   给每个词生成稳定 ID
========================================================= */

function makeWordId(word) {

    return (
        word.english +
        "__" +
        word.chinese
    )
        .toLowerCase()
        .replace(/\s+/g, "_");
}


/* =========================================================
   获取单词学习信息
========================================================= */

function getWordState(word) {

    const id = makeWordId(word);

    if (!studyData[id]) {

        studyData[id] = {

            favorite: false,

            difficult: false,

            skipped: false,

            level: 0,

            memoryStatus: "",

            nextReview: 0,

            lastReview: 0,

            reviewTimes: 0
        };
    }

    return studyData[id];
}


/* =========================================================
   加载词库
========================================================= */

async function loadWords() {

    try {

        const response =
            await fetch("./data/pesticides.json");

        if (!response.ok) {

            throw new Error(
                "无法加载 pesticides.json"
            );
        }


        const json =
            await response.json();


        allWords =
            json.pesticides

            .map(item => ({

                chinese:
                    cleanText(item.chinese),

                english:
                    cleanText(item.english)

            }))

            .filter(item =>
                item.chinese ||
                item.english
            );


        totalCount.textContent =
            allWords.length;


        createAlphabet();

        applyFilters();

        updateStats();


    } catch (error) {

        console.error(error);

        wordList.innerHTML = `
            <div class="empty-message">
                词库加载失败，请确认
                data/pesticides.json
                已正确放置。
            </div>
        `;
    }
}


/* =========================================================
   文字清理
========================================================= */

function cleanText(text) {

    if (!text) return "";

    return text
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================================
   A-Z
========================================================= */

function createAlphabet() {

    alphabet.innerHTML = "";


    const letters = [
        "ALL",
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    ];


    letters.forEach(letter => {

        const button =
            document.createElement("button");


        button.className = "letter";

        button.textContent =
            letter === "ALL"
            ? "全部"
            : letter;


        if (letter === currentLetter) {

            button.classList.add("active");
        }


        button.addEventListener(
            "click",
            () => {

                currentLetter = letter;

                currentPage = 1;

                currentMode = "all";

                studyMode = false;

                setActiveMainButton("allBtn");

                createAlphabet();

                applyFilters();
            }
        );


        alphabet.appendChild(button);
    });
}


/* =========================================================
   筛选
========================================================= */

function applyFilters() {

    const keyword =
        searchInput.value
        .trim()
        .toLowerCase();


    let result = [...allWords];


    /* 默认不显示跳过词 */

    if (currentMode !== "skipped") {

        result =
            result.filter(word => {

                return !getWordState(word).skipped;
            });
    }


    /* 搜索 */

    if (keyword) {

        result =
            result.filter(word => {

                return (

                    word.english
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    word.chinese
                    .includes(keyword)
                );
            });
    }


    /* A-Z */

    if (currentLetter !== "ALL") {

        result =
            result.filter(word => {

                return word.english
                    .toUpperCase()
                    .startsWith(currentLetter);
            });
    }


    /* 模式 */

    if (currentMode === "favorite") {

        result =
            result.filter(word =>
                getWordState(word).favorite
            );
    }


    if (currentMode === "difficult") {

        result =
            result.filter(word =>
                getWordState(word).difficult
            );
    }


    if (currentMode === "skipped") {

        result =
            allWords.filter(word =>
                getWordState(word).skipped
            );
    }


    if (currentMode === "review") {

        const now = Date.now();

        result =
            result.filter(word => {

                const state =
                    getWordState(word);

                return (
                    state.nextReview > 0 &&
                    state.nextReview <= now
                );
            });
    }


    displayedWords = result;


    resultCount.textContent =
        displayedWords.length;


    ensureValidPage();

    renderPage();

    updateModeMessage();

    updateStats();
}


/* =========================================================
   页码检查
========================================================= */

function ensureValidPage() {

    const pages =
        Math.max(
            1,
            Math.ceil(
                displayedWords.length /
                PAGE_SIZE
            )
        );


    if (currentPage > pages) {

        currentPage = pages;
    }
}


/* =========================================================
   显示当前页
========================================================= */

function renderPage() {

    wordList.innerHTML = "";


    if (
        currentMode === "random"
    ) {

        return;
    }


    if (
        displayedWords.length === 0
    ) {

        wordList.innerHTML = `
            <div class="empty-message">
                暂时没有符合条件的单词。
            </div>
        `;

        updatePagination();

        return;
    }


    const start =
        (currentPage - 1)
        * PAGE_SIZE;


    const end =
        start + PAGE_SIZE;


    const pageWords =
        displayedWords.slice(
            start,
            end
        );


    pageWords.forEach(word => {

        wordList.appendChild(
            createWordCard(word)
        );
    });


    updatePagination();
}


/* =========================================================
   建立卡片
========================================================= */

function createWordCard(
    word,
    randomMode = false
) {

    const state =
        getWordState(word);


    const card =
        document.createElement("div");


    card.className =
        randomMode
        ? "card random-card study-card"
        : "card";


    if (studyMode) {

        card.classList.add(
            "study-card"
        );
    }


    /* 英文 */

    const english =
        document.createElement("div");

    english.className =
        "english";


    english.innerHTML = `

        <span
            class="speaker"
            title="点击朗读"
        >
            🔊
        </span>

        <span class="english-text">
            ${escapeHTML(word.english)}
        </span>
    `;


    english
        .querySelector(".speaker")
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                speak(word.english);
            }
        );


    card.appendChild(english);


    /* 中文 */

    const chinese =
        document.createElement("div");

    chinese.className =
        "chinese";

    chinese.textContent =
        word.chinese;


    if (studyMode) {

        chinese.classList.add(
            "hidden-chinese"
        );
    }


    card.appendChild(chinese);


    /* 背诵模式提示 */

    if (studyMode) {

        const tip =
            document.createElement("div");

        tip.className =
            "reveal-tip";

        tip.textContent =
            "点击卡片显示中文";

        card.appendChild(tip);


        card.addEventListener(
            "click",
            event => {

                if (
                    event.target.tagName
                    === "BUTTON"
                ) {
                    return;
                }


                chinese
                    .classList
                    .remove(
                        "hidden-chinese"
                    );


                tip.style.display =
                    "none";
            }
        );
    }


    /* 状态标签 */

    if (state.memoryStatus) {

        const tag =
            document.createElement("span");

        tag.className =
            "tag review-tag";

        tag.textContent =
            memoryStatusText(
                state.memoryStatus
            );

        card.appendChild(tag);
    }


    if (state.skipped) {

        const tag =
            document.createElement("span");

        tag.className =
            "tag skip-tag";

        tag.textContent =
            "已跳过";

        card.appendChild(tag);
    }


    /* 认识 / 模糊 / 忘记 */

    if (
        studyMode ||
        currentMode === "review" ||
        randomMode
    ) {

        const memory =
            document.createElement("div");

        memory.className =
            "memory-actions";


        memory.innerHTML = `

            <button
                class="know-btn"
            >
                ✅ 认识
            </button>

            <button
                class="fuzzy-btn"
            >
                🟡 模糊
            </button>

            <button
                class="forget-btn"
            >
                ❌ 忘记
            </button>
        `;


        memory
            .querySelector(".know-btn")
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    reviewWord(
                        word,
                        "known"
                    );
                }
            );


        memory
            .querySelector(".fuzzy-btn")
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    reviewWord(
                        word,
                        "fuzzy"
                    );
                }
            );


        memory
            .querySelector(".forget-btn")
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    reviewWord(
                        word,
                        "forgotten"
                    );
                }
            );


        card.appendChild(memory);
    }


    /* 收藏 / 不会 / 跳过 */

    const actions =
        document.createElement("div");


    actions.className =
        "card-actions";


    actions.innerHTML = `

        <button class="favorite-action">
            ${
                state.favorite
                ? "⭐ 已收藏"
                : "☆ 收藏"
            }
        </button>

        <button class="difficult-action">
            ${
                state.difficult
                ? "⚠ 已标不会"
                : "⚠ 不会"
            }
        </button>

        <button class="skip-action">
            ${
                state.skipped
                ? "↩ 恢复"
                : "⏭ 跳过"
            }
        </button>
    `;


    if (state.favorite) {

        actions
            .querySelector(
                ".favorite-action"
            )
            .classList
            .add("active");
    }


    if (state.difficult) {

        actions
            .querySelector(
                ".difficult-action"
            )
            .classList
            .add("active");
    }


    actions
        .querySelector(
            ".favorite-action"
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleFavorite(word);
            }
        );


    actions
        .querySelector(
            ".difficult-action"
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleDifficult(word);
            }
        );


    actions
        .querySelector(
            ".skip-action"
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleSkipped(word);
            }
        );


    card.appendChild(actions);


    return card;
}


/* =========================================================
   复习算法
========================================================= */

/*
   这里采用“艾宾浩斯式间隔复习”的简化模型。

   认识：
   1天 → 2天 → 4天 → 7天 →
   15天 → 30天 → 60天

   模糊：
   1天后再复习，并降低一级

   忘记：
   10分钟后再次出现，并重置学习等级
*/

const REVIEW_INTERVALS = [

    1,
    2,
    4,
    7,
    15,
    30,
    60
];


function reviewWord(
    word,
    result
) {

    const state =
        getWordState(word);


    const now =
        Date.now();


    state.lastReview =
        now;


    state.reviewTimes =
        (state.reviewTimes || 0)
        + 1;


    if (result === "known") {

        state.memoryStatus =
            "known";


        state.level =
            Math.min(
                state.level + 1,
                REVIEW_INTERVALS.length
            );


        const interval =
            REVIEW_INTERVALS[
                Math.min(
                    state.level - 1,
                    REVIEW_INTERVALS.length - 1
                )
            ];


        state.nextReview =
            now +
            interval *
            24 *
            60 *
            60 *
            1000;
    }


    if (result === "fuzzy") {

        state.memoryStatus =
            "fuzzy";


        state.level =
            Math.max(
                0,
                state.level - 1
            );


        state.nextReview =
            now +
            24 *
            60 *
            60 *
            1000;


        state.difficult =
            true;
    }


    if (result === "forgotten") {

        state.memoryStatus =
            "forgotten";


        state.level = 0;


        state.nextReview =
            now +
            10 *
            60 *
            1000;


        state.difficult =
            true;
    }


    saveStudyData();


    /* 今日复习模式下自动移走当前词 */

    if (
        currentMode === "review"
    ) {

        applyFilters();

    } else {

        renderPage();

        updateStats();
    }
}


/* =========================================================
   状态名称
========================================================= */

function memoryStatusText(
    status
) {

    if (status === "known") {

        return "✅ 认识";
    }


    if (status === "fuzzy") {

        return "🟡 模糊";
    }


    if (
        status === "forgotten"
    ) {

        return "❌ 忘记";
    }


    return "";
}


/* =========================================================
   收藏
========================================================= */

function toggleFavorite(word) {

    const state =
        getWordState(word);

    state.favorite =
        !state.favorite;

    saveStudyData();

    applyFilters();
}


/* =========================================================
   不会
========================================================= */

function toggleDifficult(word) {

    const state =
        getWordState(word);

    state.difficult =
        !state.difficult;

    saveStudyData();

    applyFilters();
}


/* =========================================================
   跳过
========================================================= */

function toggleSkipped(word) {

    const state =
        getWordState(word);

    state.skipped =
        !state.skipped;


    saveStudyData();

    applyFilters();
}


/* =========================================================
   统计
========================================================= */

function updateStats() {

    const now =
        Date.now();


    let review = 0;

    let favorite = 0;

    let difficult = 0;

    let skipped = 0;


    allWords.forEach(word => {

        const state =
            getWordState(word);


        if (state.favorite) {

            favorite++;
        }


        if (state.difficult) {

            difficult++;
        }


        if (state.skipped) {

            skipped++;
        }


        if (
            !state.skipped &&
            state.nextReview > 0 &&
            state.nextReview <= now
        ) {

            review++;
        }
    });


    reviewCount.textContent =
        review;

    favoriteCount.textContent =
        favorite;

    difficultCount.textContent =
        difficult;

    skippedCount.textContent =
        skipped;
}


/* =========================================================
   搜索
========================================================= */

searchInput.addEventListener(
    "input",
    () => {

        currentPage = 1;

        applyFilters();
    }
);


/* =========================================================
   分页
========================================================= */

function updatePagination() {

    const pages =
        Math.max(
            1,
            Math.ceil(
                displayedWords.length /
                PAGE_SIZE
            )
        );


    pageInfo.textContent =
        `第 ${currentPage} / ${pages} 页`;


    prevBtn.disabled =
        currentPage <= 1;


    nextBtn.disabled =
        currentPage >= pages;


    const hide =
        currentMode === "random";


    document
        .querySelector(".pagination")
        .style.display =
        hide
        ? "none"
        : "flex";
}


prevBtn.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            renderPage();

            scrollToWords();
        }
    }
);


nextBtn.addEventListener(
    "click",
    () => {

        const pages =
            Math.ceil(
                displayedWords.length /
                PAGE_SIZE
            );


        if (currentPage < pages) {

            currentPage++;

            renderPage();

            scrollToWords();
        }
    }
);


/* =========================================================
   页面滚动
========================================================= */

function scrollToWords() {

    wordList.scrollIntoView({

        behavior: "smooth",

        block: "start"
    });
}


/* =========================================================
   顶部功能按钮
========================================================= */

document
    .getElementById("allBtn")
    .addEventListener(
        "click",
        () => {

            currentMode = "all";

            studyMode = false;

            currentPage = 1;

            setActiveMainButton(
                "allBtn"
            );

            applyFilters();
        }
    );


document
    .getElementById("studyBtn")
    .addEventListener(
        "click",
        () => {

            currentMode = "all";

            studyMode = true;

            currentPage = 1;

            setActiveMainButton(
                "studyBtn"
            );

            applyFilters();
        }
    );


document
    .getElementById("reviewBtn")
    .addEventListener(
        "click",
        () => {

            currentMode =
                "review";

            studyMode = true;

            currentPage = 1;

            currentLetter =
                "ALL";

            createAlphabet();

            setActiveMainButton(
                "reviewBtn"
            );

            applyFilters();
        }
    );


document
    .getElementById("favoriteBtn")
    .addEventListener(
        "click",
        () => {

            currentMode =
                "favorite";

            studyMode = false;

            currentPage = 1;

            setActiveMainButton(
                "favoriteBtn"
            );

            applyFilters();
        }
    );


document
    .getElementById("difficultBtn")
    .addEventListener(
        "click",
        () => {

            currentMode =
                "difficult";

            studyMode = true;

            currentPage = 1;

            setActiveMainButton(
                "difficultBtn"
            );

            applyFilters();
        }
    );


document
    .getElementById("skippedBtn")
    .addEventListener(
        "click",
        () => {

            currentMode =
                "skipped";

            studyMode = false;

            currentPage = 1;

            currentLetter =
                "ALL";

            createAlphabet();

            setActiveMainButton(
                "skippedBtn"
            );

            applyFilters();
        }
    );


/* =========================================================
   随机抽词
========================================================= */

document
    .getElementById("randomBtn")
    .addEventListener(
        "click",
        () => {

            currentMode =
                "random";

            studyMode = true;

            setActiveMainButton(
                "randomBtn"
            );

            showRandomWord();
        }
    );


function showRandomWord() {

    const pool =
        allWords.filter(word => {

            return !getWordState(word)
                .skipped;
        });


    if (pool.length === 0) {

        return;
    }


    const word =
        pool[
            Math.floor(
                Math.random()
                * pool.length
            )
        ];


    wordList.innerHTML = "";


    const card =
        createWordCard(
            word,
            true
        );


    wordList.appendChild(card);


    const again =
        document.createElement(
            "button"
        );


    again.textContent =
        "🎲 再抽一个";


    again.style.marginTop =
        "18px";


    again.style.padding =
        "11px 20px";


    again.style.border =
        "none";


    again.style.borderRadius =
        "9px";


    again.style.cursor =
        "pointer";


    again.addEventListener(
        "click",
        showRandomWord
    );


    card.appendChild(again);


    resultCount.textContent =
        "1";


    updatePagination();

    updateModeMessage();
}


/* =========================================================
   高亮顶部按钮
========================================================= */

function setActiveMainButton(
    id
) {

    document
        .querySelectorAll(
            ".control-btn"
        )
        .forEach(button => {

            button.classList
                .remove("active");
        });


    document
        .getElementById(id)
        .classList
        .add("active");
}


/* =========================================================
   模式文字
========================================================= */

function updateModeMessage() {

    let text =
        "当前：全部词汇";


    if (studyMode) {

        text =
            "当前：背诵模式｜先看英文，点击卡片查看中文";
    }


    if (
        currentMode ===
        "review"
    ) {

        text =
            "当前：今日复习｜根据你的学习记录安排";
    }


    if (
        currentMode ===
        "favorite"
    ) {

        text =
            "当前：我的收藏";
    }


    if (
        currentMode ===
        "difficult"
    ) {

        text =
            "当前：不会 / 重点复习词";
    }


    if (
        currentMode ===
        "skipped"
    ) {

        text =
            "当前：已跳过｜这些词默认不参加背诵和复习";
    }


    if (
        currentMode ===
        "random"
    ) {

        text =
            "当前：随机抽词";
    }


    modeMessage.textContent =
        text;
}


/* =========================================================
   发音
========================================================= */

function speak(text) {

    if (!text) return;


    speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        "en-US";

    speech.rate =
        0.85;

    speech.pitch =
        1;


    const voices =
        speechSynthesis.getVoices();


    speech.voice =

        voices.find(
            v =>
            v.name.includes("Zira")
        )

        ||

        voices.find(
            v =>
            v.name.includes(
                "Google US English"
            )
        )

        ||

        voices.find(
            v =>
            v.lang === "en-US"
        )

        ||

        voices.find(
            v =>
            v.lang.startsWith("en")
        )

        ||

        null;


    speechSynthesis.speak(
        speech
    );
}


/* =========================================================
   HTML 安全处理
========================================================= */

function escapeHTML(text) {

    return String(text || "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   启动
========================================================= */

loadWords();