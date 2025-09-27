// quiz-data.js
// Loading quiz data
let quizData = null;

async function loadQuizData() {
	try {
		const response = await fetch("/api/quiz-data");
		const data = await response.json();

		if (data.success) {
			// if successful fetch, it uses the returned quiz data
			quizData = data;
		} else {
			quizData = getDefaultQuizData(); // Otherwise, it falls back to default data
		}
	} catch (error) {
		quizData = getDefaultQuizData(); // Incase of fetch fails also fallback to default default quiz data
	}
}

function getDefaultQuizData() {
	// backup dataset
	return {
		categories: ["Massage", "Facial", "Body Treatment", "Wellness"],
		price_ranges: [
			"Budget (SCR0-50)",
			"Moderate (SCR50-100)",
			"Premium (SCR100-150)",
			"Luxury (SCR150+)",
		],
		durations: [
			"Quick (≤30 min)",
			"Standard (30-60 min)",
			"Extended (60-90 min)",
			"Lengthy (90+ min)",
		],
	};
}
