export async function fetchAPI(endpoint, options = {}) {
	try {
		const response = await fetch(`/api${endpoint}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		const contentType = response.headers.get("content-type");
		if (!contentType || !contentType.includes("application/json")) {
			if (contentType && contentType.includes("text/html")) {
				throw new Error(
					"Received HTML instead of JSON. Server may be redirecting."
				);
			}
			throw new Error("Invalid response format");
		}

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Request failed");
		}

		return data;
	} catch (error) {
		console.error("API Error:", error);
		throw error;
	}
}

export async function uploadFile(endpoint, formData) {
	try {
		const response = await fetch(`/api${endpoint}`, {
			method: "POST",
			body: formData,
		});

		const contentType = response.headers.get("content-type");
		if (!contentType || !contentType.includes("application/json")) {
			throw new Error("Invalid response format");
		}

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Upload failed");
		}

		return data;
	} catch (error) {
		console.error("Upload Error:", error);
		throw error;
	}
}
