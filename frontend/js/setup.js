import { fetchAPI } from "./utils/api.js";
import { showError } from "./utils/auth.js";

document.addEventListener("DOMContentLoaded", () => {
	const setupForm = document.getElementById("setupForm");
	const privacyRadios = document.querySelectorAll(
		'input[name="privacyMode"]'
	);
	const privatePasswordGroup = document.getElementById(
		"privatePasswordGroup"
	);

	privacyRadios.forEach((radio) => {
		radio.addEventListener("change", (e) => {
			document.querySelectorAll(".privacy-option").forEach((option) => {
				option.classList.remove("selected");
			});
			e.target.closest(".privacy-option").classList.add("selected");

			if (e.target.value === "private") {
				privatePasswordGroup.classList.remove("hidden");
			} else {
				privatePasswordGroup.classList.add("hidden");
			}
		});
	});

	setupForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(setupForm);
		const data = {
			username: formData.get("username"),
			biography: formData.get("biography"),
			pronouns: formData.get("pronouns"),
			age: formData.get("age"),
			location: formData.get("location"),
			privacyMode: formData.get("privacyMode"),
			privatePassword: formData.get("privatePassword"),
			adminPassword: formData.get("adminPassword"),
		};

		if (!data.username || !data.adminPassword) {
			showError("Username and admin password are required");
			return;
		}

		if (data.adminPassword.length < 8) {
			showError("Admin password must be at least 8 characters");
			return;
		}

		if (data.privacyMode === "private" && !data.privatePassword) {
			showError(
				"Private password is required when privacy mode is set to private"
			);
			return;
		}

		try {
			const submitBtn = setupForm.querySelector('button[type="submit"]');
			submitBtn.disabled = true;
			submitBtn.textContent = "Setting up...";

			await fetchAPI("/setup", {
				method: "POST",
				body: JSON.stringify(data),
			});

			window.location.href = "/";
		} catch (error) {
			showError(error.message || "Setup failed. Please try again.");
			const submitBtn = setupForm.querySelector('button[type="submit"]');
			submitBtn.disabled = false;
			submitBtn.textContent = "Complete Setup";
		}
	});
});
