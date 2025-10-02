import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { X } from "lucide-react";

declare global {
	interface Window {
		YT: any;
		onYouTubeIframeAPIReady: () => void;
	}
}

interface IntroVideoDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

const introVideoUrl = "https://youtube.com/shorts/IxMcqRSxKHg";

export const IntroVideoDialog: React.FC<IntroVideoDialogProps> = ({
	isOpen,
	onClose,
}) => {
	const [player, setPlayer] = useState<any>(null);
	const [isYtApiReady, setIsYtApiReady] = useState(
		() => typeof window !== "undefined" && !!window.YT,
	);
	const playerRef = useRef<HTMLDivElement>(null);

	// Extract YouTube video ID from URL
	const extractYouTubeVideoId = useCallback((url: string): string => {
		try {
			const urlObj = new URL(url);
			if (urlObj.hostname === "youtu.be") {
				return urlObj.pathname.substring(1);
			}
			if (
				urlObj.hostname === "www.youtube.com" ||
				urlObj.hostname === "youtube.com"
			) {
				const vParam = urlObj.searchParams.get("v");
				if (vParam) return vParam;
				if (urlObj.pathname.startsWith("/embed/")) {
					return urlObj.pathname.substring(7);
				}
				if (urlObj.pathname.startsWith("/shorts/")) {
					return urlObj.pathname.substring(8);
				}
			}
			return "";
		} catch (error) {
			console.error("Error extracting YouTube video ID:", error);
			return "";
		}
	}, []);

	// Load YouTube API
	useEffect(() => {
		if (!window.YT) {
			const tag = document.createElement("script");
			tag.src = "https://www.youtube.com/iframe_api";
			document.body.appendChild(tag);
			window.onYouTubeIframeAPIReady = () => {
				setIsYtApiReady(true);
			};
		} else if (!isYtApiReady) {
			setIsYtApiReady(true);
		}

		return () => {
			if (player?.destroy) {
				player.destroy();
			}
		};
	}, [player, isYtApiReady]);

	// Create player when dialog opens
	useEffect(() => {
		if (
			isOpen &&
			isYtApiReady &&
			!player &&
			playerRef.current &&
			introVideoUrl
		) {
			const videoId = extractYouTubeVideoId(introVideoUrl);
			if (!videoId) return;

			try {
				const newPlayer = new window.YT.Player(playerRef.current, {
					height: "100%",
					width: "100%",
					videoId: videoId,
					playerVars: {
						autoplay: 1,
						controls: 0,
						rel: 0, // no related videos at the end
						modestbranding: 1, // minimizes YouTube branding
						iv_load_policy: 3, // hides annotations
						disablekb: 1, // disables keyboard controls
						fs: 0, // no fullscreen button
						playsinline: 1,
						origin: window.location.origin,
					},
					events: {
						onReady: () => {
							console.log("Intro video player ready");
						},
						onStateChange: (event: any) => {
							if (event.data === window.YT.PlayerState.ENDED) {
								console.log("Intro video ended, closing dialog");
								onClose();
							}
						},
						onError: (error: any) => {
							console.error("Intro video player error:", error);
						},
					},
				});
				setPlayer(newPlayer);
			} catch (error) {
				console.error("Error creating intro video player:", error);
			}
		}
	}, [
		isOpen,
		isYtApiReady,
		player,
		introVideoUrl,
		extractYouTubeVideoId,
		onClose,
	]);

	// Cleanup player when dialog closes
	useEffect(() => {
		if (!isOpen && player?.destroy) {
			player.destroy();
			setPlayer(null);
		}
	}, [isOpen, player]);

	return (
		<Dialog open={isOpen} onOpenChange={() => {}}>
			<DialogContent className="max-w-none w-screen h-screen p-0 m-0 border-0 rounded-none [&>button]:hidden">
				<div className="w-full h-full bg-black relative">
					<div ref={playerRef} className="w-full h-full" />
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-0"
					>
						<X className="h-6 w-6" />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
