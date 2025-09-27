// quiz-main.js
// Quiz entry point
document.addEventListener("DOMContentLoaded", function () {
	// When the quiz modal is opened, ensures quiz data is ready (from API or defaults)
	document
		.getElementById("quizModal")
		.addEventListener("show.bs.modal", async function () {
			await loadQuizData();
			initQuiz(); // Initialize UI, setting up the first question, options, progress bar, etc
		});
	// When the quiz modal is closed,
	document
		.getElementById("quizModal")
		.addEventListener("hidden.bs.modal", function () {
			currentQuestion = 0; // starts back at the first question next time
			answers = {}; // clears any previous responses
		});
});
