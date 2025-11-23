import { fetchAPI } from "./utils/api.js";
import { showError } from "./utils/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
	await loadLinks();
});

async function loadLinks() {
	try {
		const posts = await fetchAPI("/posts?type=link");
		displayLinks(posts);
	} catch (error) {
		showError("Failed to load links");
	}
}

function displayLinks(links) {
	const container = document.getElementById("linksContainer");

	if (links.length === 0) {
		container.innerHTML = `
      <div class="no-links">
        <p>No links available yet</p>
      </div>
    `;
		return;
	}

	container.innerHTML = links
		.map(
			(link) => `
    <a href="${
		link.link_url
	}" target="_blank" rel="noopener noreferrer" class="link-item">
      <div class="link-title">${link.link_title || "Untitled Link"}</div>
      ${
			link.link_description
				? `<div class="link-description">${link.link_description}</div>`
				: ""
		}
      <div class="link-url">${link.link_url}</div>
    </a>
  `
		)
		.join("");
}
