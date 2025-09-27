// quiz-results.js
// Results + error handling layer of OmniSpa's recommendation quiz
// updates the UI depending on the user's response
async function getRecommendations() {
	// Sends the quiz answers to the API, and backend responds with recommendations
	try {
		const response = await fetch("/api/spa-recommendations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(answers),
		});

		const result = await response.json();

		if (result.success) {
			showResults(result.recommendations);
		} else {
			showError();
		}
	} catch (error) {
		showError();
	}
}

function showResults(recommendations) {
	document.getElementById("quizProgress").style.width = "100%"; //Marks the progress bar as complete

	if (recommendations.length === 0) {
		// Tells the user no matches found and offers to restart the quiz
		document.getElementById("quizContent").innerHTML = `
            <div class="quiz-result">
                <h3 class="quiz-result-title">No Perfect Match Found</h3>
                <p>We couldn't find exact matches for your preferences, but we think you might enjoy exploring all our spas! <h3>OR</h3></p>
                <button class="restart-quiz mt-3" id="restartQuiz">Try Different Preferences</button>
            </div>
        `;
	} else {
		// Builds a results section
		let resultsHtml = `
            <div class="quiz-result">
                <h3 class="quiz-result-title">We Found ${recommendations.length} Perfect Matches!</h3>
                <p>Based on your preferences, here are our recommendations:</p>
        `;

		recommendations.forEach((spa, index) => {
			// Shows spa name, description, image
			resultsHtml += `
                <div class="spa-recommendation mb-4">
                    <div class="d-flex align-items-center mb-3">
                        <img src="${spa.image}" alt="${spa.spa_name}" 
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;" class="me-3">
                        <div>
                            <h5 class="mb-1">${spa.spa_name}</h5>
                            <p class="text-muted mb-0">${spa.description}</p>
                        </div>
                    </div>
                    <h6>Recommended Services:</h6>
                    <ul class="list-group mb-3">
            `;

			spa.services.forEach((service) => {
				// Lists recommended services with duration + price
				resultsHtml += `
                    <li class="list-group-item">
                        <strong>${service.name}</strong> - 
                        ${service.duration} min - 
                        SCR${service.price}
                        ${
													service.description
														? `<br><small class="text-muted">${service.description}</small>`
														: ""
												}
                    </li>
                `;
			});

			resultsHtml += `
                    </ul>
                    <a href="/spa/${
											spa.spa_id
										}" class="btn btn-spa btn-sm">View Spa Details</a>
                </div>
                ${index < recommendations.length - 1 ? "<hr>" : ""}
            `;
		});

		resultsHtml += `
                <button class="restart-quiz mt-3" id="restartQuiz">Take Quiz Again</button>
            </div>
        `;

		document.getElementById("quizContent").innerHTML = resultsHtml;
	}
	// Resets progress, clears answers, starts quiz again
	document.getElementById("restartQuiz").addEventListener("click", function () {
		currentQuestion = 0;
		answers = {};
		initQuiz();
	});
}

function showError() {
	// Displays an error screen if the API fail
	document.getElementById("quizContent").innerHTML = `
        <div class="quiz-result">
            <h3 class="quiz-result-title">Oops! Something went wrong</h3>
            <p>We couldn't load recommendations at the moment. Please try again later.</p>
            <button class="restart-quiz" id="restartQuiz">Try Again</button>
        </div>
    `;
	// Lets the user retry
	document.getElementById("restartQuiz").addEventListener("click", function () {
		currentQuestion = 0;
		answers = {};
		initQuiz();
	});
}
