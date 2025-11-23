export function showError(message, containerId = "errorContainer") {
	const container = document.getElementById(containerId);
	if (!container) return;

	container.innerHTML = `
    <div class="alert alert-error">
      ${message}
    </div>
  `;

	setTimeout(() => {
		container.innerHTML = "";
	}, 5000);
}

export function showSuccess(message, containerId = "errorContainer") {
	const container = document.getElementById(containerId);
	if (!container) return;

	container.innerHTML = `
    <div class="alert alert-success">
      ${message}
    </div>
  `;

	setTimeout(() => {
		container.innerHTML = "";
	}, 5000);
}

export function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
