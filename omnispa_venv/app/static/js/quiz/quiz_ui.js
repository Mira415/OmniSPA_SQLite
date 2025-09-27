// quiz-ui.js
// Quiz interaction and navigation logic
function loadQuestion() {
	const questionData = questions[currentQuestion]; // Picks the current question from questions[currentQuestion]
	const progress = (currentQuestion / questions.length) * 100; // Updates the progress bar based on how many questions are completed.

	document.getElementById("quizProgress").style.width = `${progress}%`;
	// Builds HTML for all possible answer options
	let optionsHtml = "";
	questionData.options.forEach((option, index) => {
		optionsHtml += `
            <div class="quiz-option" data-value="${option.value}">
                ${option.text}
            </div>
        `;
	});
	// Shows the question text, shows all options and adds navigation
	document.getElementById("quizContent").innerHTML = `
        <div class="quiz-question">${questionData.question}</div>
        <div class="quiz-options">${optionsHtml}</div>
        <div class="quiz-navigation">
            ${
							currentQuestion > 0
								? `<button class="btn btn-outline-secondary" id="prevQuestion">Previous</button>`
								: `<div></div>`
						}
            <button class="btn btn-spa" id="nextQuestion" disabled>
                ${
									currentQuestion === questions.length - 1
										? "See Results"
										: "Next"
								}
            </button>
        </div>
    `;
	// Handle option clicks
	document.querySelectorAll(".quiz-option").forEach((option) => {
		option.addEventListener("click", function () {
			document.querySelectorAll(".quiz-option").forEach((opt) => {
				opt.classList.remove("selected"); // When a user clicks an option, .selected class from all other options are cleared..
			});
			this.classList.add("selected"); // Adds .selected to the clicked option
			document.getElementById("nextQuestion").disabled = false; // Enables the Next button
		});
	});
	// Navigation buttons
	if (currentQuestion > 0) {
		document
			.getElementById("prevQuestion")
			.addEventListener("click", goToPreviousQuestion);
	}

	document
		.getElementById("nextQuestion")
		.addEventListener("click", goToNextQuestion);
}

function goToNextQuestion() {
	// Go to next question
	const selectedOption = document.querySelector(".quiz-option.selected");
	if (!selectedOption) return;

	const questionData = questions[currentQuestion];
	answers[questionData.key] = selectedOption.getAttribute("data-value"); // Saves the selected option into answers, Example: { category: "Massage", price_range: "Budget" }

	if (currentQuestion < questions.length - 1) {
		// If not the last question then move to next question
		currentQuestion++;
		loadQuestion();
	} else {
		getRecommendations();
	}
}

function goToPreviousQuestion() {
	// Moves backward and re-renders the previous question
	if (currentQuestion > 0) {
		currentQuestion--;
		loadQuestion();
	}
}
