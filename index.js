const APP_STATES = ['start', 'loadingQuiz', 'play', 'finish'];
const FALLBACK_WORDS = ['Car', 'Cat', 'Mouse'];
const FALLBACK_DESCRIPTION = `Hey I'm a random description`;

/*
Format:

[
  description: 'Hey I'm a ___',
  rightAnswer: 'Bob',
  userAnswer: null
]

*/
let questions = [];

// You can use this variable to keep track of which question the user is now answering.
let currentQuestionIndex = 0;

// Utils

function disableBtn(btnEl) {
  btnEl.disabled = true;
  btnEl.classList.add('disabled');
}

function unDisableBtn(btnEl) {
  btnEl.disabled = false;
  btnEl.classList.remove('disabled');
}

function getRandomElementsFromArray(arr, n) {
  return [...arr]
    .sort(() => Math.random() - Math.random())
    .slice(0, n);
}

function getQuizQuestionFromDescription(description) {
  const matchRegex = /\w+/g;

  const matches = [...description.matchAll(matchRegex)];

  const match = getRandomElementsFromArray(matches, 1)[0];

  return {
    question:
      description.substring(0, match.index) +
      '_'.repeat(match[0].length) +
      description.substring(match[0].length + match.index),
    rightAnswer: match[0],
  };
}

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

// App

// get El by dataId
function getElByDataId(dataId) {
  return document.querySelector(`[data-id='${dataId}']`);
}


// set App state
function setAppState(state) {
  if (APP_STATES.includes(state)) {
    getElByDataId('app').dataset.state = state;
  } else {
    alert('This state is not defined');
  }
}

// !!! If you want to build app yourself remove the code below !!!

// !!! You're not limited to the functions below, you can remove them, rename them, add more functions, do whatever you need to build an application !!!

// Fetch and return random words
// n {number} – number of words you want to fetch
async function getRandomWords(n) {
  try {
    const response = await fetch(
      `https://random-word-api.herokuapp.com/word?number=${n}`
    )

    console.log('prom', response)

    if (response.ok) {
      const words = await response.json();
      return words;
    }

    console.info('Something went wrong with fetching random words');
  } catch (error) {
    console.error(error);
  }

  return FALLBACK_WORDS;
}

// Fetch and return repositories
async function getRepos() {
  try {
    const response = await fetch(
      'https://api.github.com/repositories'
    );

    if (response.ok) {
      const repository = await response.json();
      return repository;
    }
  } catch (error) {
    console.error(error);
  }

  return [];
}

// show question
async function showQuestion({question, rightAnswer}) {
  const randomWords = await getRandomWords(3);

  // зашафленные ответы
  const answers = shuffleArray([...randomWords, rightAnswer]);

  [...getElByDataId('answers').children].forEach(
    (answerBtn, index) => {
      // каждая кнопка должна иметь ответ
      answerBtn.innerHTML = answers[index];
      answerBtn.dataset.value = answers[index];
    }
  );

  // новый вопрос - новый номер вопроса
  getElByDataId('questionNumber').innerHTML =
    currentQuestionIndex + 1;

  getElByDataId('question').innerHTML = question;
}

// Start quiz
async function startQuiz() {
  disableBtn(getElByDataId('nextQuestionBtn'));
  setAppState('loadingQuiz');

  const repository = await getRepos();

  const quizRepository = getRandomElementsFromArray(repository, 5);

  console.log(quizRepository);

  questions = quizRepository.map(
    ({description = FALLBACK_DESCRIPTION}) => {
      return getQuizQuestionFromDescription(description);
    }
  );

  // await
  await showQuestion(questions[currentQuestionIndex]);



  setAppState('play');
}

// Restart quiz
function restartQuiz() {
  setAppState('start');

  question = [];

  currentQuestionIndex = 0;
}

// On choose one of the answers in the quiz
function chooseAnswer(event) {
  event.preventDefault();

  const chosenElement = event.target;

  const userAnswer = chosenElement.dataset.value;

  [...getElByDataId('answers').children].forEach((answerBtn) => {
    disableBtn(answerBtn);
  });

  questions[currentQuestionIndex].userAnswer = userAnswer;

  if (questions[currentQuestionIndex].rightAnswer === userAnswer) {
    chosenElement.classList.add('rightAnswer');
  } else {
    chosenElement.classList.add('wrongAnswer');
  }

  unDisableBtn(getElByDataId('nextQuestionBtn'));
}

// Click on the "Next Question" button
async function nextQuestion() {
  disableBtn(getElByDataId('nextQuestionBtn'));
  [...getElByDataId('answers').children].forEach((answerBtn) => {
    unDisableBtn(answerBtn);
    answerBtn.classList.remove('rightAnswer', 'wrongAnswer');
  });

  if (questions.length === currentQuestionIndex + 1) {
    setAppState('finish');

    let rightAnswersCount = 0;

    questions.forEach(({rightAnswer, userAnswer}) => {
      if (rightAnswer === userAnswer) {
        rightAnswersCount += 1;
      }
    });

    getElByDataId('rightAnswersCount').innerHTML = rightAnswersCount;
  } else {
    currentQuestionIndex += 1;

    showQuestion(questions[currentQuestionIndex]);
  }
}

document
  .querySelector('[data-id="startQuizBtn"]')
  .addEventListener('click', startQuiz);

document
  .querySelector('[data-id="restartQuizBtn"]')
  .addEventListener('click', restartQuiz);

document
  .querySelector('[data-id="nextQuestionBtn"]')
  .addEventListener('click', nextQuestion);

document
  .querySelector('[data-id="answers"]')
  .addEventListener('click', chooseAnswer);
