import React, {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux";
import {
	fetchContentForGroup,
	fetchQuestionsForVideo,
	fetchAnswerOptions,
	submitUserResponses,
	upsertUserProgress,
	fetchUserProgress,
	fetchUserResponses,
	fetchUserDayProgress,
	upsertUserDayProgress,
} from "../../services/airtableService";
import type {
	ContentItem,
	UserProgress,
	UserDayProgress,
	QuestionnaireFormData,
} from "../../types/airtable";
import Questionnaire, { type QuestionWithAnswerOptions } from "./Questionnaire";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import StudyTimeline from "./StudyTimeline";
import { IntroVideoDialog } from "./IntroVideoDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Play, Clock, AlertTriangle } from "lucide-react";

declare global {
	interface Window {
		YT: any;
		onYouTubeIframeAPIReady: () => void;
	}
}

const getDaysSince = (dateString?: string): number => {
	if (!dateString) return 0;
	const givenDate = new Date(dateString);
	const today = new Date();
	givenDate.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);
	const diffTime = today.getTime() - givenDate.getTime();
	return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const GroupBDashboard: React.FC = () => {
	const [content, setContent] = useState<ContentItem[]>([]);
	const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
	const [userResponses, setUserResponses] = useState<any[]>([]);
	const [userDayProgress, setUserDayProgress] = useState<UserDayProgress[]>([]);
	const [questions, setQuestions] = useState<QuestionWithAnswerOptions[]>([]);
	const [showQuestionnaire, setShowQuestionnaire] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [player, setPlayer] = useState<any>(null);
	const [showWarningDialog, setShowWarningDialog] = useState(false);
	const [videoStarted, setVideoStarted] = useState(false);
	const [isVideoLoading, setIsVideoLoading] = useState(false);
	const [isYtApiReady, setIsYtApiReady] = useState(
		() => typeof window !== "undefined" && !!window.YT,
	);
	const [isTodaysVideoCompleted, setIsTodaysVideoCompleted] = useState(false);
	const [isTodayCompleted, setIsTodayCompleted] = useState(false);
	const [showFullPageLoader, setShowFullPageLoader] = useState(false);
	const [isProcessingVideo, setIsProcessingVideo] = useState(false);
	const [showIntroVideo, setShowIntroVideo] = useState(false);
	const playerRef = useRef<HTMLDivElement>(null);

	// Callback ref to ensure we know when the element is available
	const setPlayerRef = (element: HTMLDivElement | null) => {
		playerRef.current = element;
		if (element) {
			console.log("GroupB: Player ref element is now available");
		}
	};
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.user);

	// Function to extract YouTube video ID from various URL formats
	const extractYouTubeVideoId = useCallback((url: string): string => {
		try {
			const urlObj = new URL(url);

			// Handle youtu.be short URLs
			if (urlObj.hostname === "youtu.be") {
				return urlObj.pathname.substring(1); // Remove the leading '/'
			}

			// Handle youtube.com URLs
			if (
				urlObj.hostname === "www.youtube.com" ||
				urlObj.hostname === "youtube.com"
			) {
				// Standard watch URLs
				const vParam = urlObj.searchParams.get("v");
				if (vParam) return vParam;

				// Handle /embed/ URLs
				if (urlObj.pathname.startsWith("/embed/")) {
					return urlObj.pathname.substring(7); // Remove '/embed/'
				}

				// Handle /shorts/ URLs
				if (urlObj.pathname.startsWith("/shorts/")) {
					return urlObj.pathname.substring(8); // Remove '/shorts/'
				}
			}

			return "";
		} catch (error) {
			console.error("Error extracting YouTube video ID:", error);
			return "";
		}
	}, []);

	const journeyDay = useMemo(() => {
		const day = getDaysSince(user.airtableRecord?.createdTime) + 1;
		console.log(
			"GroupB: Journey day calculated:",
			day,
			"from createdTime:",
			user.airtableRecord?.createdTime,
		);
		return day;
	}, [user.airtableRecord]);

	// Find today's video based on UserDayProgress
	const getNextVideo = useMemo(() => {
		if (!content.length || !user.airtableRecord) return null;

		// Sort content by Order column (each order represents a day)
		const sortedContent = [...content].sort(
			(a, b) => (a.fields.Order || 0) - (b.fields.Order || 0),
		);

		// Check if any day was completed today
		const today = new Date().toDateString();
		const completedToday = userDayProgress.find((dp) => {
			if (!dp.fields.IsVideoCompleted || !dp.fields.IsQuestionnaireCompleted) {
				return false;
			}
			const createdAt = new Date(
				dp.createdTime || dp.fields.CreatedAt || "",
			).toDateString();
			return createdAt === today;
		});

		// If something was completed today, don't show any video (wait for tomorrow)
		if (completedToday) {
			console.log("GroupB: Day completed today, waiting for tomorrow");
			return null;
		}

		// Find the first incomplete day
		const incompleteDay = userDayProgress.find(
			(dayProgress) =>
				!dayProgress.fields.IsVideoCompleted ||
				!dayProgress.fields.IsQuestionnaireCompleted,
		);

		let targetDay: number;
		if (incompleteDay) {
			// User has incomplete day, show that day
			targetDay = incompleteDay.fields.Day;
		} else {
			// All completed days, find the next day to start
			const completedDays = userDayProgress
				.filter(
					(dp) =>
						dp.fields.IsVideoCompleted && dp.fields.IsQuestionnaireCompleted,
				)
				.map((dp) => dp.fields.Day)
				.sort((a, b) => a - b);

			const maxCompletedDay =
				completedDays.length > 0 ? Math.max(...completedDays) : 0;
			targetDay = maxCompletedDay + 1;
		}

		// Get video for target day
		const todaysVideo = sortedContent.find(
			(video) => (video.fields.Order || 0) === targetDay,
		);

		console.log(
			"GroupB: Target day:",
			targetDay,
			"Video:",
			todaysVideo?.fields.Title,
			"Incomplete day:",
			incompleteDay?.fields.Day,
		);
		return todaysVideo;
	}, [content, userDayProgress, user.airtableRecord]);

	// Check if user can access current day based on UserDayProgress
	const canAccessCurrentDay = useMemo(() => {
		const todaysVideo = getNextVideo;
		if (!todaysVideo) return false;

		const targetDay = todaysVideo.fields.Order || 1;

		// First day is always accessible
		if (targetDay === 1) return true;

		// Check if all previous days are completed
		const previousDays = content.filter(
			(video) => (video.fields.Order || 0) < targetDay,
		);

		// If there are no previous days, allow access
		if (previousDays.length === 0) return true;

		// Check if all previous days are completed using UserDayProgress
		const allPreviousDaysCompleted = previousDays.every((video) => {
			const dayProgress = userDayProgress.find(
				(dp) => dp.fields.Day === video.fields.Order,
			);
			const isCompleted =
				dayProgress?.fields.IsVideoCompleted &&
				dayProgress?.fields.IsQuestionnaireCompleted;
			console.log(`GroupB: Day ${video.fields.Order} completed:`, isCompleted);
			return isCompleted;
		});

		console.log(
			"GroupB: Can access current day:",
			allPreviousDaysCompleted,
			"Target day:",
			targetDay,
			"Previous days:",
			previousDays.length,
		);
		return allPreviousDaysCompleted;
	}, [userDayProgress, content, getNextVideo]);

	const todaysVideo = getNextVideo;
	const totalDays = useMemo(() => {
		if (content.length === 0) return 7; // Default fallback
		return Math.max(...content.map((c) => c.fields.Order || 0));
	}, [content]);

	// Debug logging
	console.log("GroupB: Current state:", {
		journeyDay,
		todaysVideo: todaysVideo?.fields.Title,
		canAccessCurrentDay,
		isTodaysVideoCompleted,
		showQuestionnaire,
		userProgressCount: userProgress.length,
		userResponsesCount: userResponses.length,
	});
	const isFirstTime = useMemo(() => {
		return userDayProgress.length === 0; // No day progress records means first time
	}, [userDayProgress]);

	useEffect(() => {
		const loadData = async () => {
			if (!user.airtableRecord) return;
			setIsLoading(true);
			try {
				console.log(
					"GroupB: Loading data for user:",
					user.airtableRecord.fields.UserID,
				);
				const [
					groupBContent,
					progressRecords,
					userResponseRecords,
					dayProgressRecords,
				] = await Promise.all([
					fetchContentForGroup("Group B"),
					fetchUserProgress(user.airtableRecord.fields.UserID),
					fetchUserResponses(user.airtableRecord.fields.UserID),
					fetchUserDayProgress(user.airtableRecord.fields.UserID),
				]);
				console.log("GroupB: Raw content loaded:", groupBContent);
				console.log("GroupB: User progress loaded:", progressRecords);
				console.log("GroupB: User responses loaded:", userResponseRecords);
				console.log("GroupB: User day progress loaded:", dayProgressRecords);

				const sortedContent = groupBContent.sort(
					(a, b) => (a.fields.Order || 0) - (b.fields.Order || 0),
				);
				setContent(sortedContent);
				setUserProgress(progressRecords);
				setUserResponses(userResponseRecords);
				setUserDayProgress(dayProgressRecords);

				// Check if all Group B content is completed
				if (sortedContent.length > 0) {
					// Check if all days are completed
					const allDaysCompleted = sortedContent.every((video) => {
						const dayProgress = dayProgressRecords.find(
							(dp) => dp.fields.Day === video.fields.Order,
						);
						return (
							dayProgress?.fields.IsVideoCompleted &&
							dayProgress?.fields.IsQuestionnaireCompleted
						);
					});

					if (allDaysCompleted) {
						console.log(
							"GroupB: All content completed, navigating to complete page",
						);
						navigate("/complete");
						return;
					}
				}
			} catch (error) {
				console.error("Error loading Group B data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		if (user.airtableRecord?.fields.UserID) {
			loadData();
		}
	}, [user.airtableRecord, navigate]);

	// Check if today's video is completed based on UserDayProgress
	useEffect(() => {
		const checkCompletionStatus = async () => {
			if (!user.airtableRecord || content.length === 0) {
				setIsTodaysVideoCompleted(false);
				setIsTodayCompleted(false);
				return;
			}

			try {
				// Check if any day was completed today
				const today = new Date().toDateString();
				const completedToday = userDayProgress.find((dp) => {
					if (
						!dp.fields.IsVideoCompleted ||
						!dp.fields.IsQuestionnaireCompleted
					) {
						return false;
					}
					const createdAt = new Date(
						dp.createdTime || dp.fields.CreatedAt || "",
					).toDateString();
					return createdAt === today;
				});

				if (completedToday) {
					console.log(
						"GroupB: Day completed today, setting today completed flag",
					);
					setIsTodayCompleted(true);
					setIsTodaysVideoCompleted(false);
					return;
				}

				const todaysVideo = getNextVideo;

				if (!todaysVideo) {
					console.log("GroupB: No video available");
					setIsTodaysVideoCompleted(false);
					setIsTodayCompleted(false);
					return;
				}

				const targetDay = todaysVideo.fields.Order || 1;

				// Check UserDayProgress for this day
				const dayProgress = userDayProgress.find(
					(dp) => dp.fields.Day === targetDay,
				);

				if (dayProgress) {
					const isCompleted =
						dayProgress.fields.IsVideoCompleted &&
						dayProgress.fields.IsQuestionnaireCompleted;
					console.log(
						"GroupB: Day completion status:",
						isCompleted,
						"for day:",
						targetDay,
					);
					setIsTodaysVideoCompleted(isCompleted);
					setIsTodayCompleted(false);

					// If today is completed, check if all days are completed
					if (isCompleted) {
						const allDaysCompleted = content.every((video) => {
							const dayProgress = userDayProgress.find(
								(dp) => dp.fields.Day === video.fields.Order,
							);
							return (
								dayProgress?.fields.IsVideoCompleted &&
								dayProgress?.fields.IsQuestionnaireCompleted
							);
						});

						if (allDaysCompleted) {
							console.log("GroupB: All days completed, navigating to complete");
							navigate("/complete");
						}
					}
				} else {
					// No day progress record means not completed
					console.log("GroupB: No day progress record for day:", targetDay);
					setIsTodaysVideoCompleted(false);
					setIsTodayCompleted(false);
				}
			} catch (error) {
				console.error("Error checking completion status:", error);
				setIsTodaysVideoCompleted(false);
				setIsTodayCompleted(false);
			}
		};

		checkCompletionStatus();
	}, [userDayProgress, user.airtableRecord, content, navigate, getNextVideo]);

	// Show intro video for first-time users
	useEffect(() => {
		if (isFirstTime && !isLoading && userDayProgress.length === 0) {
			console.log("GroupB: First time user detected, showing intro video");
			setShowIntroVideo(true);
		}
	}, [isFirstTime, isLoading, userDayProgress.length]);

	useEffect(() => {
		console.log(
			"GroupB: YouTube API useEffect triggered, window.YT exists:",
			!!window.YT,
			"isYtApiReady:",
			isYtApiReady,
		);

		if (!window.YT) {
			console.log("GroupB: Loading YouTube API script");
			const tag = document.createElement("script");
			tag.src = "https://www.youtube.com/iframe_api";
			document.body.appendChild(tag);
			window.onYouTubeIframeAPIReady = () => {
				console.log("GroupB: YouTube API is ready");
				setIsYtApiReady(true);
			};
		} else if (!isYtApiReady) {
			console.log("GroupB: YouTube API already loaded, setting state");
			setIsYtApiReady(true);
		}

		// Cleanup function to destroy player when component unmounts
		return () => {
			if (player?.destroy) {
				console.log("GroupB: Destroying player on cleanup");
				player.destroy();
			}
		};
	}, [player, isYtApiReady]);

	const destroyPlayer = useCallback(() => {
		if (player?.destroy) {
			player.destroy();
			setPlayer(null);
			setVideoStarted(false);
		}
	}, [player]);

	const handleVideoComplete = useCallback(async () => {
		if (!todaysVideo || !user.airtableRecord || isProcessingVideo) return;

		console.log(
			"GroupB: handleVideoComplete triggered for video:",
			todaysVideo.fields.Title,
			`(ID: ${todaysVideo.id})`,
		);

		setIsProcessingVideo(true);
		setShowFullPageLoader(true);

		// Destroy the player first
		destroyPlayer();

		try {
			// Mark video as completed in UserProgress (keep existing logic)
			await upsertUserProgress({
				userRecordId: user.airtableRecord.id,
				videoRecordId: todaysVideo.id,
				WatchPercentage: 100,
				Status: "Completed",
			});

			// Update UserDayProgress - mark video as completed
			await upsertUserDayProgress({
				userRecordId: user.airtableRecord.id,
				day: todaysVideo.fields.Order || 1,
				isVideoCompleted: true,
				isQuestionnaireCompleted: false, // Will be updated after questionnaire
			});

			// Refresh user progress to reflect the completion
			const [updatedProgress, updatedDayProgress] = await Promise.all([
				fetchUserProgress(user.airtableRecord.fields.UserID),
				fetchUserDayProgress(user.airtableRecord.fields.UserID),
			]);
			setUserProgress(updatedProgress);
			setUserDayProgress(updatedDayProgress);

			// Now, check for questions
			console.log(
				"GroupB: Fetching questions for video ID:",
				todaysVideo.fields.VideoID,
			);
			const fetchedQuestions = await fetchQuestionsForVideo(
				todaysVideo.fields.VideoID,
			);
			console.log("GroupB: Fetched questions response:", fetchedQuestions);

			if (fetchedQuestions.length > 0) {
				// Check which questions are already answered
				const answeredQuestionIds = userResponses
					.map((r) => r.fields.Question?.[0])
					.filter(Boolean);

				const unansweredQuestions = fetchedQuestions.filter(
					(q) => !answeredQuestionIds.includes(q.id),
				);

				if (unansweredQuestions.length > 0) {
					console.log(
						`GroupB: Found ${unansweredQuestions.length} unanswered questions. Preparing questionnaire.`,
					);
					const optionIds = unansweredQuestions.flatMap(
						(q) => q.fields.AnswerOptions || [],
					);
					const options = await fetchAnswerOptions(optionIds);
					const questionsWithOptions = unansweredQuestions.map((q) => ({
						...q,
						answerOptions: options.filter((opt) =>
							q.fields.AnswerOptions?.includes(opt.id),
						),
					}));
					setQuestions(questionsWithOptions);
					setShowQuestionnaire(true);
				} else {
					console.log(
						"GroupB: All questions for this video have been answered. The completion view will be shown on re-render.",
					);
				}
			} else {
				console.log(
					"GroupB: No questions found for this video. The completion view will be shown on re-render.",
				);
			}
		} catch (error) {
			console.error("Error handling video completion:", error);
		} finally {
			setShowFullPageLoader(false);
			setIsProcessingVideo(false);
		}
	}, [
		todaysVideo,
		user.airtableRecord,
		userResponses,
		destroyPlayer,
		isProcessingVideo,
	]);

	const createPlayer = useCallback(() => {
		console.log("GroupB: createPlayer called", {
			todaysVideo: !!todaysVideo,
			windowYT: !!window.YT,
			YTPlayer: !!window.YT?.Player,
			playerRefCurrent: !!playerRef.current,
		});

		if (!todaysVideo) {
			console.error("GroupB: No todaysVideo available");
			return;
		}

		if (!window.YT || !window.YT.Player) {
			console.error("GroupB: YouTube API not ready");
			return;
		}

		if (!playerRef.current) {
			console.error("GroupB: playerRef.current is null");
			return;
		}

		const videoId = extractYouTubeVideoId(todaysVideo.fields.YouTubeURL);
		console.log(
			"GroupB: Extracted video ID:",
			videoId,
			"from URL:",
			todaysVideo.fields.YouTubeURL,
		);

		if (!videoId) {
			console.error(
				"GroupB: Could not extract video ID from URL:",
				todaysVideo.fields.YouTubeURL,
			);
			setIsVideoLoading(false);
			return;
		}

		console.log("GroupB: Creating YouTube player");
		// Note: isVideoLoading is already set to true in handleConfirmPlay

		try {
			const newPlayer = new window.YT.Player(playerRef.current, {
				height: "315",
				width: "560",
				videoId: videoId,
				playerVars: {
					autoplay: 1,
					controls: 0,
					rel: 0,
					showinfo: 0,
					modestbranding: 1,
					disablekb: 1,
					fs: 0,
					iv_load_policy: 3,
				},
				events: {
					onReady: () => {
						console.log("GroupB: YouTube player ready");
						setIsVideoLoading(false);
						setVideoStarted(true);
					},
					onStateChange: (event: any) => {
						console.log("GroupB: Player state changed:", event.data);
						if (event.data === window.YT.PlayerState.ENDED) {
							console.log("GroupB: Video ended, handling completion");
							handleVideoComplete();
						}
					},
					onError: (error: any) => {
						console.error("GroupB: YouTube player error:", error);
						setIsVideoLoading(false);
					},
				},
			});
			setPlayer(newPlayer);
			console.log("GroupB: YouTube player created successfully");
		} catch (error) {
			console.error("GroupB: Error creating YouTube player:", error);
			setIsVideoLoading(false);
		}
	}, [todaysVideo, extractYouTubeVideoId, handleVideoComplete]);

	// Effect to create the player when conditions are right
	useEffect(() => {
		if (isVideoLoading && isYtApiReady && !player && playerRef.current) {
			console.log("GroupB: Conditions met, creating player via useEffect.");
			createPlayer();
		}
	}, [isVideoLoading, isYtApiReady, player, createPlayer]);

	const handlePlayVideo = () => {
		setShowWarningDialog(true);
	};

	const handleConfirmPlay = () => {
		console.log("GroupB: User confirmed play, closing dialog");
		setShowWarningDialog(false);

		// Set loading state to trigger player creation effect
		setIsVideoLoading(true);
	};

	const handleCancelPlay = () => {
		setShowWarningDialog(false);
	};

	const handleIntroVideoClose = () => {
		setShowIntroVideo(false);
	};

	const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
		if (!user.airtableRecord || !todaysVideo) return;
		setIsSubmitting(true);
		try {
			const responses = Object.entries(answers).map(([questionId, answer]) => ({
				User: [user.airtableRecord?.id || ""],
				Question: [questionId],
				SelectedAnswer: answer,
			}));
			await submitUserResponses(responses);

			// Update UserDayProgress - mark questionnaire as completed
			await upsertUserDayProgress({
				userRecordId: user.airtableRecord.fields.UserID,
				day: todaysVideo.fields.Order || 1,
				isVideoCompleted: true,
				isQuestionnaireCompleted: true,
			});

			// Refresh user data to reflect the new answers
			const [updatedResponses, updatedDayProgress] = await Promise.all([
				fetchUserResponses(user.airtableRecord.fields.UserID),
				fetchUserDayProgress(user.airtableRecord.fields.UserID),
			]);
			setUserResponses(updatedResponses);
			setUserDayProgress(updatedDayProgress);

			setShowQuestionnaire(false);

			// Check if all days are now completed using UserDayProgress
			const allDaysCompleted = content.every((video) => {
				const dayProgress = updatedDayProgress.find(
					(dp) => dp.fields.Day === video.fields.Order,
				);
				return (
					dayProgress?.fields.IsVideoCompleted &&
					dayProgress?.fields.IsQuestionnaireCompleted
				);
			});

			if (allDaysCompleted) {
				console.log(
					"GroupB: All days completed after questionnaire submission",
				);
				navigate("/complete");
			}
		} catch (error) {
			console.error("Error submitting questionnaire:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Full page loader for video completion to questions transition
	if (showFullPageLoader) {
		return (
			<div className="fixed inset-0 flex items-center justify-center z-50">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="text-lg font-medium">Processing video completion...</p>
					<p className="text-sm text-muted-foreground">Loading questions...</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				<Skeleton className="h-8 w-1/2" />
				<Skeleton className="h-6 w-1/4" />
				<Skeleton className="w-full h-96" />
			</div>
		);
	}

	// Show completion message if today's day is completed or if today's content was completed
	if ((isTodaysVideoCompleted || isTodayCompleted) && !showQuestionnaire) {
		// Check if all days are completed
		const allDaysCompleted = content.every((video) => {
			const dayProgress = userDayProgress.find(
				(dp) => dp.fields.Day === video.fields.Order,
			);
			return (
				dayProgress?.fields.IsVideoCompleted &&
				dayProgress?.fields.IsQuestionnaireCompleted
			);
		});

		// If all content is completed, navigate to complete page
		if (allDaysCompleted) {
			navigate("/complete");
			return null;
		}

		// If today's content was completed, show "wait for tomorrow" message
		if (isTodayCompleted) {
			const completedToday = userDayProgress.find((dp) => {
				if (
					!dp.fields.IsVideoCompleted ||
					!dp.fields.IsQuestionnaireCompleted
				) {
					return false;
				}
				const today = new Date().toDateString();
				const createdAt = new Date(
					dp.createdTime || dp.fields.CreatedAt || "",
				).toDateString();
				return createdAt === today;
			});

			const completedDay = completedToday?.fields.Day || 1;
			const nextDay = completedDay + 1;
			const hasNextDay = content.some(
				(video) => (video.fields.Order || 0) === nextDay,
			);

			return (
				<div className="text-center p-10">
					<div className="max-w-md mx-auto space-y-4">
						<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
							<svg
								className="h-8 w-8 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold">Day {completedDay} Complete!</h2>
						<p className="text-muted-foreground">
							{hasNextDay
								? `You have completed Day ${completedDay}. Please come back tomorrow for Day ${nextDay}.`
								: "You have completed today's content. Please check back for more content."}
						</p>
					</div>
				</div>
			);
		}

		// Regular completion message for completed days
		const todaysVideo = getNextVideo;
		const currentDay = todaysVideo?.fields.Order || 1;
		const nextDay = currentDay + 1;
		const hasNextDay = content.some(
			(video) => (video.fields.Order || 0) === nextDay,
		);

		return (
			<div className="text-center p-10">
				<div className="max-w-md mx-auto space-y-4">
					<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
						<svg
							className="h-8 w-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold">Day {currentDay} Complete!</h2>
					<p className="text-muted-foreground">
						{hasNextDay
							? `You have completed Day ${currentDay}. Please come back tomorrow for Day ${nextDay}.`
							: "You have completed today's content. Please check back for more content."}
					</p>
				</div>
			</div>
		);
	}

	// Show access denied message if user hasn't completed previous days
	if (!canAccessCurrentDay && !showQuestionnaire) {
		const todaysVideo = getNextVideo;
		const targetDay = todaysVideo?.fields.Order || 1;

		return (
			<div className="text-center p-10">
				<div className="max-w-md mx-auto space-y-4">
					<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100">
						<svg
							className="h-8 w-8 text-amber-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold">Complete Previous Days First</h2>
					<p className="text-muted-foreground">
						You need to complete all previous days before accessing Day{" "}
						{targetDay}. Please complete the videos and questions for the
						previous days first.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-screen-lg mx-auto p-2 md:p-4 space-y-4">
			<div className="text-center md:text-left">
				<h1 className="text-xl md:text-2xl font-bold">Group B Dashboard</h1>
				<p className="text-muted-foreground text-sm md:text-base">
					Day {todaysVideo?.fields.Order || 1} of {totalDays}
				</p>
				{isFirstTime && (
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h3 className="font-semibold text-blue-900">
							Welcome to Day {todaysVideo?.fields.Order || 1} of your study
							journey!
						</h3>
						<p className="text-blue-800 text-sm mt-1">
							You'll watch one video per day and answer questions. Each session
							takes about 5 minutes. Remember, videos can only be watched once,
							so make sure you're ready!
						</p>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
				{/* Main Video Area */}
				<div className="lg:col-span-2 xl:col-span-3">
					{!showQuestionnaire ? (
						todaysVideo ? (
							<Card className="h-fit">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg md:text-xl">
										{todaysVideo.fields.Title}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{!videoStarted && !isVideoLoading ? (
										// Show video thumbnail with play button
										<div className="relative w-full aspect-video bg-black rounded overflow-hidden">
											{(() => {
												const videoId = extractYouTubeVideoId(
													todaysVideo.fields.YouTubeURL,
												);
												return (
													<img
														src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
														alt={todaysVideo.fields.Title}
														className="w-full h-full object-cover"
														onError={(e) => {
															// Fallback to standard quality thumbnail if maxres doesn't exist
															e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
														}}
													/>
												);
											})()}
											<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
												<Button
													onClick={handlePlayVideo}
													size="lg"
													className="bg-red-600 hover:bg-red-700 text-white rounded-full p-6"
												>
													<Play className="h-8 w-8 ml-1" fill="currentColor" />
												</Button>
											</div>
										</div>
									) : (
										// Show player container with optional loading overlay
										<div className="relative w-full aspect-video bg-black rounded">
											<div ref={setPlayerRef} className="w-full h-full" />
											{isVideoLoading && (
												<div className="absolute inset-0 bg-black flex items-center justify-center">
													<div className="text-white text-center space-y-4">
														<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
														<p>Loading video...</p>
													</div>
												</div>
											)}
										</div>
									)}

									<div className="mt-4 space-y-2">
										<p className="text-center text-muted-foreground">
											{!videoStarted
												? `Click play to start Day ${todaysVideo?.fields.Order || 1} video. Remember, it can only be watched once!`
												: "Video is playing. Please watch until the end to proceed to questions."}
										</p>
										{!videoStarted && (
											<div className="flex items-center justify-center text-sm text-muted-foreground">
												<Clock className="h-4 w-4 mr-1" />
												<span>Estimated time: ~5 minutes</span>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						) : (
							<Card className="h-fit">
								<CardContent className="p-6 text-center">
									<h2 className="text-2xl font-bold">No video available.</h2>
									<p>Please check back later or contact support.</p>
								</CardContent>
							</Card>
						)
					) : (
						<Questionnaire
							questions={questions}
							onSubmit={handleQuestionnaireSubmit}
							isLoading={isSubmitting}
						/>
					)}
				</div>

				{/* Upcoming Videos Sidebar */}
				<div className="lg:col-span-1 xl:col-span-1">
					<Card className="h-fit sticky top-6 gap-2">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg md:text-xl">
								Upcoming Videos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 max-h-[70vh] overflow-y-auto p-3">
							{content.map((video, index) => {
								const dayNumber = video.fields.Order || index + 1;
								const isCurrentDay = todaysVideo?.fields.Order === dayNumber;
								const isCompleted = userDayProgress.some(
									(dp) =>
										dp.fields.Day === dayNumber &&
										dp.fields.IsVideoCompleted &&
										dp.fields.IsQuestionnaireCompleted,
								);
								const isLocked = dayNumber > (todaysVideo?.fields.Order || 1);

								return (
									<div
										key={video.id}
										className={`w-full p-2 flex flex-row justify-between items-center rounded-lg border ${
											isCurrentDay
												? "border-primary bg-primary/5"
												: isCompleted
													? "border-green-500 bg-green-50"
													: "border-border bg-muted/50"
										}`}
									>
										<h4 className="font-medium text-xs md:text-sm leading-tight">
											Day {dayNumber}
										</h4>
										<Badge
											variant={
												isCompleted
													? "default"
													: isCurrentDay
														? "secondary"
														: "outline"
											}
											className="text-xs"
										>
											{isCompleted
												? "Completed"
												: isCurrentDay
													? "Current"
													: "Locked"}
										</Badge>
									</div>
								);
							})}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="mt-2">
				<StudyTimeline
					currentDay={todaysVideo?.fields.Order || 1}
					totalDays={totalDays}
				/>
			</div>

			{/* Warning Dialog */}
			<Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							Video Playback Warning
						</DialogTitle>
						<DialogDescription className="text-left pt-2">
							Please read the following important information before proceeding.
						</DialogDescription>
						<div className="space-y-3 text-left">
							<p className="font-medium">Important:</p>
							<ul className="space-y-2 text-sm">
								<li>
									• This video can only be watched <strong>once</strong> and
									cannot be replayed
								</li>
								<li>
									• Please ensure you are in a quiet environment and ready to
									focus
								</li>
								<li>• You will need to answer questions after the video</li>
								<li>• The entire process should take no more than 5 minutes</li>
							</ul>
							<p className="text-sm font-medium text-amber-700 bg-amber-50 p-3 rounded-lg">
								Make sure you are positioned to watch the video and answer the
								questions that follow.
							</p>
						</div>
					</DialogHeader>
					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={handleCancelPlay}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmPlay}
							className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
						>
							Continue & Play Video
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Intro Video Dialog for first-time users */}
			<IntroVideoDialog
				isOpen={showIntroVideo}
				onClose={handleIntroVideoClose}
			/>
		</div>
	);
};

export default GroupBDashboard;
