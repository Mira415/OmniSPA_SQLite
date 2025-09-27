// quiz-questions.js
// Quiz engine that defines the questions, tracks progress, and initializes the quiz with dynamic data
let currentQuestion = 0;
let answers = {};

const questions = [
	{
		question: "What type of treatment are you looking for?",
		key: "category",
		options: [], // to be filled from API data like categories/durations
	},
	{
		question: "What's your budget preference?",
		key: "price_range",
		options: [],
	},
	{
		question: "How much time do you have?",
		key: "duration",
		options: [],
	},
	{
		question: "What's your main goal for this spa visit?",
		key: "goal",
		options: [
			{ text: "Relaxation and stress relief", value: "relaxation" },
			{ text: "Rejuvenation and energy", value: "energy" },
			{ text: "Pain relief and recovery", value: "recovery" },
			{ text: "Skin care and beauty", value: "beauty" },
		],
	},
	{
		question: "What atmosphere do you prefer?",
		key: "atmosphere",
		options: [
			{ text: "Tranquil and serene", value: "serene" },
			{ text: "Modern and chic", value: "modern" },
			{ text: "Natural and earthy", value: "natural" },
			{ text: "Luxurious and opulent", value: "luxury" },
		],
	},
];

function initQuiz() {
	// Injects dynamic options into the first 3 questions
	questions[0].options = quizData.categories.map((cat) => ({
		text: cat,
		value: cat,
	}));
	questions[1].options = quizData.price_ranges.map((price) => ({
		text: price,
		value: price,
	}));
	questions[2].options = quizData.durations.map((dur) => ({
		text: dur,
		value: dur,
	}));

	loadQuestion();
}
