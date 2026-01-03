// ====== Constants & Data ======
const PASS_PERCENT = 60;

const LS_KEYS = {
  USERS: "sq_users",
  CURRENT_USER: "sq_current_user",
  RESULTS: "sq_results",
  POINTS: "sq_points"
};

// Initial question bank (admin can add more)
let QUESTIONS = [
  {
    id: 1,
    text: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "Hyperlinks and Text Markup Language",
      "Home Tool Markup Language",
      "HighText Markup Language"
    ],
    correctIndex: 0,
    difficulty: "easy",
    topic: "HTML",
    explanation: "HTML stands for HyperText Markup Language and defines the structure of web pages."
  },
  {
    id: 2,
    text: "Which tag is used for the largest heading?",
    options: ["<h6>", "<head>", "<h1>", "<title>"],
    correctIndex: 2,
    difficulty: "easy",
    topic: "HTML",
    explanation: "<h1> represents the highest level heading, used for main titles."
  },
  {
    id: 3,
    text: "What does CSS stand for?",
    options: [
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Creative Style System",
      "Colorful Style Sheets"
    ],
    correctIndex: 0,
    difficulty: "medium",
    topic: "CSS",
    explanation: "CSS stands for Cascading Style Sheets and is used to style and layout web pages."
  },
  {
    id: 4,
    text: "Which CSS property controls the text size?",
    options: ["font-style", "font-size", "text-size", "text-style"],
    correctIndex: 1,
    difficulty: "medium",
    topic: "CSS",
    explanation: "The font-size property is used to set the size of the text."
  },
  {
    id: 5,
    text: "Which method converts a JSON string into a JavaScript object?",
    options: [
      "JSON.stringify()",
      "JSON.parse()",
      "JSON.toObject()",
      "JSON.convert()"
    ],
    correctIndex: 1,
    difficulty: "hard",
    topic: "JavaScript",
    explanation: "JSON.parse() takes a JSON-formatted string and converts it into a JavaScript object."
  },
  {
    id: 6,
    text: "Which keyword declares a variable with block scope?",
    options: ["var", "let", "function", "class"],
    correctIndex: 1,
    difficulty: "hard",
    topic: "JavaScript",
    explanation: "let declares a block-scoped variable, unlike var which is function-scoped."
  }
];

// ====== Helpers (LocalStorage) ======
function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ====== State ======
let currentUser = null;

let currentDifficulty = "medium";
let askedQuestionIds = [];
let currentQuestion = null;
let lastAnswerCorrect = null;
let gapStats = {};
let explanationLog = [];
let maxQuestions = 6;
let quizStartTime = null;
let remainingTime = 0;
let timerInterval = null;

// ====== DOM ======
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const quizSection = document.getElementById("quizSection");
const resultSection = document.getElementById("resultSection");

const studentIdInput = document.getElementById("studentId");
const studentNameInput = document.getElementById("studentName");
const userRoleSelect = document.getElementById("userRole");
const rememberMeCheckbox = document.getElementById("rememberMe");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");
const userInfoSpan = document.getElementById("userInfo");

const profileName = document.getElementById("profileName");
const profileId = document.getElementById("profileId");
const profileRole = document.getElementById("profileRole");
const profileLastAttempt = document.getElementById("profileLastAttempt");
const profilePoints = document.getElementById("profilePoints");

const startAdaptiveBtn = document.getElementById("startAdaptiveBtn");
const leaderboardOl = document.getElementById("leaderboard");
const badgeListUl = document.getElementById("badgeList");

const adminPanel = document.getElementById("adminPanel");
const adminQuestionText = document.getElementById("adminQuestionText");
const adminOptA = document.getElementById("adminOptA");
const adminOptB = document.getElementById("adminOptB");
const adminOptC = document.getElementById("adminOptC");
const adminOptD = document.getElementById("adminOptD");
const adminCorrect = document.getElementById("adminCorrect");
const adminTopic = document.getElementById("adminTopic");
const adminDifficulty = document.getElementById("adminDifficulty");
const adminExplanation = document.getElementById("adminExplanation");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const adminScoresUl = document.getElementById("adminScores");

const quizTitle = document.getElementById("quizTitle");
const quizTimer = document.getElementById("quizTimer");
const questionMeta = document.getElementById("questionMeta");
const questionText = document.getElementById("questionText");
const optionsList = document.getElementById("optionsList");
const submitQuizBtn = document.getElementById("submitQuizBtn");
const quizMsg = document.getElementById("quizMsg");

const resultScore = document.getElementById("resultScore");
const resultPercent = document.getElementById("resultPercent");
const resultGrade = document.getElementById("resultGrade");
const resultCorrect = document.getElementById("resultCorrect");
const resultWrong = document.getElementById("resultWrong");
const resultTime = document.getElementById("resultTime");
const resultPoints = document.getElementById("resultPoints");
const gapList = document.getElementById("gapList");
const explanationList = document.getElementById("explanationList");

const certName = document.getElementById("certName");
const certQuiz = document.getElementById("certQuiz");
const certGrade = document.getElementById("certGrade");
const certDate = document.getElementById("certDate");
const certIdSpan = document.getElementById("certId");

const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const printBtn = document.getElementById("printBtn");
const backToDashBtn = document.getElementById("backToDashBtn");
const themeToggleBtn = document.getElementById("themeToggle");

const selectSound = document.getElementById("selectSound");
const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

// ====== Generic UI ======
function showSection(section) {
  [loginSection, dashboardSection, quizSection, resultSection].forEach(sec =>
    sec.classList.add("hidden")
  );
  section.classList.remove("hidden");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerUI() {
  quizTimer.textContent = formatTime(Math.max(0, remainingTime));
  if (remainingTime <= 10) quizTimer.classList.add("low");
  else quizTimer.classList.remove("low");
}

function startTimer() {
  clearInterval(timerInterval);
  remainingTime = 120; // total quiz time
  updateTimerUI();
  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerUI();
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      quizMsg.textContent = "Time up! Auto-submitting your quiz.";
      submitAdaptiveQuiz();
    }
  }, 1000);
}

// Disable right-click during quiz
document.addEventListener("contextmenu", e => {
  if (!quizSection.classList.contains("hidden")) {
    e.preventDefault();
    alert("Right click disabled during quiz for integrity.");
  }
});

// Basic tab-switch warning
let lastVisibilityChange = Date.now();
document.addEventListener("visibilitychange", () => {
  if (quizSection.classList.contains("hidden")) return;
  if (document.hidden) {
    lastVisibilityChange = Date.now();
  } else {
    const diff = Date.now() - lastVisibilityChange;
    if (diff > 1000) {
      alert("Warning: tab switching detected during quiz.");
    }
  }
});

// ====== Auth & Profile ======
function updateProfileUI() {
  if (!currentUser) return;
  profileName.textContent = currentUser.name;
  profileId.textContent = currentUser.id;
  profileRole.textContent = currentUser.role;

  const points = loadLS(LS_KEYS.POINTS, {});
  const p = points[currentUser.id] || 0;
  profilePoints.textContent = `${p} pts (${getLevel(p)})`;

  const results = loadLS(LS_KEYS.RESULTS, []);
  const last = results
    .filter(r => r.userId === currentUser.id)
    .sort((a, b) => b.date - a.date)[0];
  profileLastAttempt.textContent = last
    ? new Date(last.date).toLocaleString()
    : "N/A";
}

function login() {
  const id = studentIdInput.value.trim();
  const name = studentNameInput.value.trim();
  const role = userRoleSelect.value;

  if (!id || !name) {
    loginMsg.textContent = "Please enter ID and Name.";
    return;
  }

  const users = loadLS(LS_KEYS.USERS, {});
  if (!users[id]) {
    users[id] = { id, name, role };
  } else {
    users[id].name = name;
    users[id].role = role;
  }
  saveLS(LS_KEYS.USERS, users);

  currentUser = users[id];
  userInfoSpan.textContent = `${currentUser.name} (${currentUser.role})`;
  logoutBtn.classList.remove("hidden");

  if (rememberMeCheckbox.checked) {
    saveLS(LS_KEYS.CURRENT_USER, id);
  } else {
    localStorage.removeItem(LS_KEYS.CURRENT_USER);
  }

  studentIdInput.value = "";
  studentNameInput.value = "";
  loginMsg.textContent = "";

  if (currentUser.role === "admin") {
    adminPanel.classList.remove("hidden");
    renderAdminData();
  } else {
    adminPanel.classList.add("hidden");
  }

  updateProfileUI();
  renderLeaderboard();
  renderBadges();
  showSection(dashboardSection);
}

function autoLoginIfRemembered() {
  const savedId = loadLS(LS_KEYS.CURRENT_USER, null);
  if (!savedId) return;
  const users = loadLS(LS_KEYS.USERS, {});
  if (users[savedId]) {
    currentUser = users[savedId];
    userInfoSpan.textContent = `${currentUser.name} (${currentUser.role})`;
    logoutBtn.classList.remove("hidden");
    if (currentUser.role === "admin") {
      adminPanel.classList.remove("hidden");
      renderAdminData();
    }
    updateProfileUI();
    renderLeaderboard();
    renderBadges();
    showSection(dashboardSection);
  }
}

function logout() {
  currentUser = null;
  userInfoSpan.textContent = "";
  logoutBtn.classList.add("hidden");
  showSection(loginSection);
}

// ====== Gamification (Levels & Badges) ======
function getLevel(points) {
  if (points >= 300) return "Expert";
  if (points >= 150) return "Intermediate";
  return "Beginner";
}

function calculateBadges(userId) {
  const results = loadLS(LS_KEYS.RESULTS, []);
  const userResults = results.filter(r => r.userId === userId);
  const badges = new Set();

  const totalAttempts = userResults.length;
  const bestPercent = userResults.reduce(
    (max, r) => (r.percent > max ? r.percent : max),
    0
  );
  const fastSolver = userResults.some(r => r.timeTakenSec <= 30);
  const accuracyMaster = userResults.some(r => r.percent >= 95);
  const quizChampion = bestPercent >= 90 && totalAttempts >= 3;

  if (fastSolver) badges.add("Fast Solver");
  if (accuracyMaster) badges.add("Accuracy Master");
  if (quizChampion) badges.add("Quiz Champion");

  const points = loadLS(LS_KEYS.POINTS, {});
  const p = points[userId] || 0;
  badges.add(getLevel(p) + " Level");

  return Array.from(badges);
}

function renderBadges() {
  if (!currentUser) return;
  const badges = calculateBadges(currentUser.id);
  badgeListUl.innerHTML = "";
  badges.forEach(b => {
    const li = document.createElement("li");
    li.textContent = b;
    badgeListUl.appendChild(li);
  });
}

function renderLeaderboard() {
  const results = loadLS(LS_KEYS.RESULTS, []);
  const bestByUser = {};
  results.forEach(r => {
    if (!bestByUser[r.userId] || r.percent > bestByUser[r.userId].percent) {
      bestByUser[r.userId] = r;
    }
  });
  const sorted = Object.values(bestByUser).sort((a, b) => b.percent - a.percent);
  leaderboardOl.innerHTML = "";
  sorted.slice(0, 5).forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.userName} - ${r.percent}% (${r.quizTitle})`;
    leaderboardOl.appendChild(li);
  });
}

// ====== Adaptive Difficulty Engine ======
function getQuestionsByDifficulty(diff) {
  return QUESTIONS.filter(
    q => q.difficulty === diff && !askedQuestionIds.includes(q.id)
  );
}

function pickRandomQuestion(diff) {
  const pool = getQuestionsByDifficulty(diff);
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

function adjustDifficulty() {
  if (lastAnswerCorrect === null) return;
  if (lastAnswerCorrect) {
    if (currentDifficulty === "easy") currentDifficulty = "medium";
    else if (currentDifficulty === "medium") currentDifficulty = "hard";
  } else {
    if (currentDifficulty === "hard") currentDifficulty = "medium";
    else if (currentDifficulty === "medium") currentDifficulty = "easy";
  }
}

function getNextAdaptiveQuestion() {
  adjustDifficulty();
  let q = pickRandomQuestion(currentDifficulty);
  if (!q) {
    const order = ["easy", "medium", "hard"];
    for (const d of order) {
      q = pickRandomQuestion(d);
      if (q) break;
    }
  }
  return q;
}

// ====== Quiz Flow ======
function startAdaptiveQuiz() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }
  currentDifficulty = "medium";
  askedQuestionIds = [];
  lastAnswerCorrect = null;
  gapStats = {};
  explanationLog = [];
  maxQuestions = 6;
  quizStartTime = Date.now();
  quizMsg.textContent = "";
  quizTitle.textContent = "Adaptive Mixed Quiz";

  startTimer();
  loadNextQuestion();
  showSection(quizSection);
}

function loadNextQuestion() {
  if (askedQuestionIds.length >= maxQuestions) {
    submitAdaptiveQuiz();
    return;
  }
  currentQuestion = getNextAdaptiveQuestion();
  if (!currentQuestion) {
    submitAdaptiveQuiz();
    return;
  }
  askedQuestionIds.push(currentQuestion.id);
  renderQuestion();
}

function renderQuestion() {
  questionText.textContent = currentQuestion.text;
  questionMeta.textContent = `Level: ${currentDifficulty.toUpperCase()} | Topic: ${currentQuestion.topic}`;
  optionsList.innerHTML = "";
  currentQuestion.options.forEach((opt, idx) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.addEventListener("click", () => handleAnswer(idx));
    optionsList.appendChild(li);
  });
}

function handleAnswer(chosenIndex) {
  selectSound.currentTime = 0;
  selectSound.play();

  const isCorrect = chosenIndex === currentQuestion.correctIndex;
  lastAnswerCorrect = isCorrect;

  // Topic-wise stats
  if (!gapStats[currentQuestion.topic]) {
    gapStats[currentQuestion.topic] = { correct: 0, wrong: 0 };
  }
  if (isCorrect) gapStats[currentQuestion.topic].correct++;
  else gapStats[currentQuestion.topic].wrong++;

  // Log explanation
  explanationLog.push({
    text: currentQuestion.text,
    options: currentQuestion.options,
    chosenIndex,
    correctIndex: currentQuestion.correctIndex,
    explanation: currentQuestion.explanation,
    topic: currentQuestion.topic,
    difficulty: currentQuestion.difficulty
  });

  loadNextQuestion();
}

submitQuizBtn.addEventListener("click", () => {
  if (!currentQuestion) return;
  if (!confirm("End quiz and submit now?")) return;
  submitAdaptiveQuiz();
});

function buildGapSummary() {
  const summary = [];
  Object.keys(gapStats).forEach(topic => {
    const { correct, wrong } = gapStats[topic];
    const total = correct + wrong;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    let label = "Needs Improvement";
    if (percent >= 80) label = "Strong";
    else if (percent >= 50) label = "Average";
    summary.push({ topic, correct, wrong, percent, label });
  });
  return summary;
}

function submitAdaptiveQuiz() {
  clearInterval(timerInterval);

  const total = explanationLog.length;
  const correct = explanationLog.filter(
    q => q.chosenIndex === q.correctIndex
  ).length;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  let grade = "F";
  if (percent >= 90) grade = "A+";
  else if (percent >= 80) grade = "A";
  else if (percent >= 70) grade = "B";
  else if (percent >= 60) grade = "C";

  const timeTakenSec = Math.round((Date.now() - quizStartTime) / 1000);
  const pointsEarned = Math.max(10, correct * 5 + (100 - timeTakenSec));
  const passed = percent >= PASS_PERCENT;

  if (passed) {
    correctSound.currentTime = 0;
    correctSound.play();
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play();
  }

  const results = loadLS(LS_KEYS.RESULTS, []);
  results.push({
    userId: currentUser.id,
    userName: currentUser.name,
    quizId: "adaptive_mixed",
    quizTitle: "Adaptive Mixed Quiz",
    quizCategory: "Mixed",
    score: correct,
    correct,
    wrong: total - correct,
    percent,
    grade,
    timeTakenSec,
    date: Date.now()
  });
  saveLS(LS_KEYS.RESULTS, results);

  const points = loadLS(LS_KEYS.POINTS, {});
  points[currentUser.id] = (points[currentUser.id] || 0) + pointsEarned;
  saveLS(LS_KEYS.POINTS, points);

  updateProfileUI();
  renderLeaderboard();
  renderBadges();
  if (currentUser.role === "admin") renderAdminData();

  // Fill result UI
  resultScore.textContent = correct;
  resultPercent.textContent = percent + "%";
  resultGrade.textContent = grade;
  resultCorrect.textContent = correct;
  resultWrong.textContent = total - correct;
  resultTime.textContent = timeTakenSec + " sec";
  resultPoints.textContent = pointsEarned;

  // Learning gap list
  gapList.innerHTML = "";
  buildGapSummary().forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.topic}: ${item.label} (${item.percent}% correct, C:${item.correct} W:${item.wrong})`;
    gapList.appendChild(li);
  });

  // Explanations
  explanationList.innerHTML = "";
  explanationLog.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.text}</strong><br>
      Your answer: ${item.options[item.chosenIndex] || "Not answered"}<br>
      Correct answer: ${item.options[item.correctIndex]}<br>
      Explanation: ${item.explanation}
    `;
    explanationList.appendChild(li);
  });

  // Certificate
  const certId = "SQ-" + Date.now().toString(36) + "-" + currentUser.id;
  certName.textContent = currentUser.name;
  certQuiz.textContent = "Adaptive Mixed Quiz";
  certGrade.textContent = grade;
  certDate.textContent = new Date().toLocaleString();
  certIdSpan.textContent = certId;

  const certBox = document.getElementById("certificate");
  certBox.style.opacity = passed ? "1" : "0.4";
  certBox.style.filter = passed ? "none" : "grayscale(1)";
  downloadPdfBtn.disabled = !passed;
  printBtn.disabled = !passed;

  showSection(resultSection);
}

// ====== Certificate download / print ======
downloadPdfBtn.addEventListener("click", () => {
  const data = `
Student: ${certName.textContent}
Quiz: ${certQuiz.textContent}
Grade: ${certGrade.textContent}
Date: ${certDate.textContent}
Certificate ID: ${certIdSpan.textContent}
Score: ${resultScore.textContent} (${resultPercent.textContent})
`;
  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz-certificate.txt";
  a.click();
  URL.revokeObjectURL(url);
  alert("Text certificate downloaded. You can convert it to PDF.");
});

printBtn.addEventListener("click", () => window.print());
backToDashBtn.addEventListener("click", () => showSection(dashboardSection));

// ====== Theme Toggle ======
themeToggleBtn.addEventListener("click", () => {
  if (document.body.classList.contains("dark")) {
    document.body.classList.remove("dark");
    themeToggleBtn.textContent = "Dark";
  } else {
    document.body.classList.add("dark");
    themeToggleBtn.textContent = "Light";
  }
});

// ====== Admin Panel ======
function renderAdminData() {
  const results = loadLS(LS_KEYS.RESULTS, []);
  adminScoresUl.innerHTML = "";
  results.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.userName} [${r.userId}] - ${r.quizTitle}: ${r.score} (${r.percent}%)`;
    adminScoresUl.appendChild(li);
  });
}

addQuestionBtn.addEventListener("click", () => {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Only admin can add questions.");
    return;
  }
  const text = adminQuestionText.value.trim();
  const optA = adminOptA.value.trim();
  const optB = adminOptB.value.trim();
  const optC = adminOptC.value.trim();
  const optD = adminOptD.value.trim();
  const correctIndex = parseInt(adminCorrect.value, 10);
  const topic = adminTopic.value;
  const difficulty = adminDifficulty.value;
  const explanation = adminExplanation.value.trim();

  if (!text || !optA || !optB || !optC || !optD || !explanation) {
    alert("Please fill all fields including explanation.");
    return;
  }

  const newId = QUESTIONS.length
    ? Math.max(...QUESTIONS.map(q => q.id)) + 1
    : 1;

  QUESTIONS.push({
    id: newId,
    text,
    options: [optA, optB, optC, optD],
    correctIndex,
    topic,
    difficulty,
    explanation
  });

  adminQuestionText.value = "";
  adminOptA.value = "";
  adminOptB.value = "";
  adminOptC.value = "";
  adminOptD.value = "";
  adminExplanation.value = "";
  alert("Question added.");
});

// ====== Events & Init ======
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
startAdaptiveBtn.addEventListener("click", startAdaptiveQuiz);

autoLoginIfRemembered();
