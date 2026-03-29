let youtubeApiReadyPromise: Promise<void> | null = null;

export const loadYouTubeIframeApi = (): Promise<void> => {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("YouTube API can only be loaded in the browser"));
	}

	if (window.YT && window.YT.Player) {
		return Promise.resolve();
	}

	if (youtubeApiReadyPromise) {
		return youtubeApiReadyPromise;
	}

	youtubeApiReadyPromise = new Promise((resolve, reject) => {
		const existingCallback = window.onYouTubeIframeAPIReady;

		window.onYouTubeIframeAPIReady = () => {
			if (typeof existingCallback === "function") {
				try {
					existingCallback();
				} catch (error) {
					console.warn("Error in existing onYouTubeIframeAPIReady callback", error);
				}
			}

			resolve();
		};

		if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
			// Script already injected but may not yet be ready; watch for YT global.
			const checkTimeout = setTimeout(() => {
				if (window.YT && window.YT.Player) {
					clearTimeout(checkTimeout);
					resolve();
				} else {
					reject(new Error("YouTube API load timed out"));
				}
			}, 15000);
			return;
		}

		const tag = document.createElement("script");
		tag.src = "https://www.youtube.com/iframe_api";
		tag.async = true;
		tag.onload = () => {
			// onYouTubeIframeAPIReady handles resolve.
		};
		tag.onerror = () => reject(new Error("Failed to load YouTube iframe API"));
		document.body.appendChild(tag);
	});

	return youtubeApiReadyPromise;
};
