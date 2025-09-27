// registration-data.js
const spaServices = []; // hold a list of services that will be offered offers
const uploadedImages = [];
const weeklyAvailability = {
	// Each day of the week is an object with, closed (boolean) and slots (array)
	monday: { closed: false, slots: [] },
	tuesday: { closed: false, slots: [] },
	wednesday: { closed: false, slots: [] },
	thursday: { closed: false, slots: [] },
	friday: { closed: false, slots: [] },
	saturday: { closed: false, slots: [] },
	sunday: { closed: false, slots: [] },
};

function getCategoryName(categoryValue) {
	// Converts internal category values into human-readable names
	const categories = {
		massage: "Massage",
		facial: "Facial",
		beauty: "Beauty",
		hair: "Hair",
	};
	return categories[categoryValue] || "Other";
}
