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
} from "../../services/airtableService";
import type {
	ContentItem,
	UserProgress,
	QuestionnaireFormData,
} from "../../types/airtable";
import Questionnaire, { type QuestionWithAnswerOptions } from "./Questionnaire";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import StudyTimeline from "./StudyTimeline";
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

// Function to check if user has completed all Group B content
const isGroupBCompleted = async (
	userRecordId: string,
	content: ContentItem[],
): Promise<boolean> => {
	if (!userRecordId || content.length === 0) return false;

	try {
		// Get all user progress and responses
		const [userProgress, userResponses] = await Promise.all([
			fetchUserProgress(userRecordId),
			fetchUserResponses(userRecordId),
		]);

		console.log({ userProgress, userResponses });

		// Check if all videos are completed
		const completedVideos = content.filter((video) => {
			const videoProgress = userProgress.find(
				(p) => p.fields.Video?.[0] === video.id,
			);
			return (
				videoProgress?.fields.Status === "Completed" ||
				(videoProgress?.fields.WatchPercentage ?? 0) >= 90
			);
		});

		// Check if all questions are answered for completed videos
		const allQuestionsAnswered = await Promise.all(
			completedVideos.map(async (video) => {
				const questions = await fetchQuestionsForVideo(video.fields.VideoID);
				const answeredQuestions = questions.filter((question) =>
					userResponses.some(
						(response) => response.fields.Question?.[0] === question.id,
					),
				);
				return answeredQuestions.length === questions.length;
			}),
		);

		return (
			completedVideos.length === content.length &&
			allQuestionsAnswered.every(Boolean)
		);
	} catch (error) {
		console.error("Error checking Group B completion:", error);
		return false;
	}
};

const GroupBDashboard: React.FC = () => {
	const [content, setContent] = useState<ContentItem[]>([]);
	const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
	const [userResponses, setUserResponses] = useState<any[]>([]);
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

	// Algorithm to find today's video based on journey day
	const getNextVideo = useMemo(() => {
		if (!content.length || !user.airtableRecord) return null;

		// Sort content by Order column (each order represents a day)
		const sortedContent = [...content].sort(
			(a, b) => (a.fields.Order || 0) - (b.fields.Order || 0),
		);

		// Get today's video based on journey day
		const todaysVideo = sortedContent.find(
			(video) => (video.fields.Order || 0) === journeyDay,
		);

		if (!todaysVideo) {
			console.log("GroupB: No video found for journey day:", journeyDay);
			return null;
		}

		console.log(
			"GroupB: Today's video:",
			todaysVideo.fields.Title,
			"for day:",
			journeyDay,
		);
		return todaysVideo;
	}, [content, journeyDay, user.airtableRecord]);

	// Check if user has completed all previous days to access current day
	const canAccessCurrentDay = useMemo(() => {
		if (!userProgress.length || journeyDay === 1) return true; // First day is always accessible

		// Check if all previous days are completed
		const previousDays = content.filter(
			(video) => (video.fields.Order || 0) < journeyDay,
		);

		// If there are no previous days, allow access
		if (previousDays.length === 0) return true;

		// Check if all previous days are completed
		const allPreviousDaysCompleted = previousDays.every((video) => {
			const videoProgress = userProgress.find(
				(p) =>
					p.fields.Video?.[0] === video.id &&
					(p.fields.WatchPercentage === 100 || p.fields.Status === "Completed"),
			);
			console.log(
				`GroupB: Previous day ${video.fields.Order} (${video.fields.Title}) completed:`,
				!!videoProgress,
			);
			return !!videoProgress;
		});

		console.log(
			"GroupB: Can access current day:",
			allPreviousDaysCompleted,
			"Previous days:",
			previousDays.length,
		);
		return allPreviousDaysCompleted;
	}, [userProgress, journeyDay, content]);

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
		return userProgress.length === 0; // No progress records means first time
	}, [userProgress]);

	useEffect(() => {
		const loadData = async () => {
			if (!user.airtableRecord) return;
			setIsLoading(true);
			try {
				console.log(
					"GroupB: Loading data for user:",
					user.airtableRecord.fields.UserID,
				);
				const [groupBContent, progressRecords, userResponseRecords] =
					await Promise.all([
						fetchContentForGroup("Group B"),
						fetchUserProgress(user.airtableRecord.fields.UserID),
						fetchUserResponses(user.airtableRecord.fields.UserID),
					]);
				console.log("GroupB: Raw content loaded:", groupBContent);
				console.log("GroupB: User progress loaded:", progressRecords);
				console.log("GroupB: User responses loaded:", userResponseRecords);

				const sortedContent = groupBContent.sort(
					(a, b) => (a.fields.Order || 0) - (b.fields.Order || 0),
				);
				setContent(sortedContent);
				setUserProgress(progressRecords);
				setUserResponses(userResponseRecords);

				// Check if all Group B content is completed
				if (sortedContent.length > 0) {
					const completed = await isGroupBCompleted(
						user.airtableRecord.fields.UserID,
						sortedContent,
					);
					if (completed) {
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

	// Check if today's video is completed OR if all videos up to today are completed
	useEffect(() => {
		const checkCompletionStatus = async () => {
			if (!user.airtableRecord || content.length === 0) {
				setIsTodaysVideoCompleted(false);
				return;
			}

			try {
				// First, check if today's video exists and is completed
				const todaysVideo = content.find(
					(video) => (video.fields.Order || 0) === journeyDay,
				);

				if (todaysVideo) {
					// Check if today's video is completed
					const videoProgress = userProgress.find(
						(p) =>
							p.fields.Video?.[0] === todaysVideo.id &&
							(p.fields.WatchPercentage === 100 ||
								p.fields.Status === "Completed"),
					);

					if (videoProgress) {
						// Check if all questions for today's video are answered
						const questions = await fetchQuestionsForVideo(
							todaysVideo.fields.VideoID,
						);

						if (questions.length === 0) {
							console.log("GroupB: Today's video has no questions, completed");
							setIsTodaysVideoCompleted(true);
							return;
						}

						const answeredQuestionIds = userResponses
							.map((r) => r.fields.Question?.[0])
							.filter(Boolean);

						const allQuestionsAnswered = questions.every((q) =>
							answeredQuestionIds.includes(q.id),
						);

						console.log(
							"GroupB: Today's video questions answered:",
							allQuestionsAnswered,
						);
						console.log(
							"GroupB: Questions for today's video:",
							questions.map((q) => q.id),
						);
						console.log("GroupB: Answered question IDs:", answeredQuestionIds);
						setIsTodaysVideoCompleted(allQuestionsAnswered);
						return;
					}
				}

				// If today's video doesn't exist or isn't completed, check if all previous days are completed
				// This handles the case where user has completed all available content
				const videosUpToToday = content.filter(
					(video) => (video.fields.Order || 0) <= journeyDay,
				);

				console.log(
					"GroupB: No video for today, checking if all videos up to day are completed:",
					journeyDay,
				);

				const allVideosCompleted = await Promise.all(
					videosUpToToday.map(async (video) => {
						const videoProgress = userProgress.find(
							(p) =>
								p.fields.Video?.[0] === video.id &&
								(p.fields.WatchPercentage === 100 ||
									p.fields.Status === "Completed"),
						);

						if (!videoProgress) {
							console.log(`GroupB: Video ${video.fields.Title} not completed`);
							return false;
						}

						const questions = await fetchQuestionsForVideo(
							video.fields.VideoID,
						);

						if (questions.length === 0) {
							return true;
						}

						const answeredQuestionIds = userResponses
							.map((r) => r.fields.Question?.[0])
							.filter(Boolean);

						const allQuestionsAnswered = questions.every((q) =>
							answeredQuestionIds.includes(q.id),
						);

						return allQuestionsAnswered;
					}),
				);

				const isCompleted = allVideosCompleted.every(Boolean);
				console.log("GroupB: All videos up to today completed:", isCompleted);
				setIsTodaysVideoCompleted(isCompleted);
			} catch (error) {
				console.error("Error checking completion status:", error);
				setIsTodaysVideoCompleted(false);
			}
		};

		checkCompletionStatus();
	}, [journeyDay, userProgress, userResponses, user.airtableRecord, content]);

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
		if (!todaysVideo || !user.airtableRecord) return;

		console.log(
			"GroupB: handleVideoComplete triggered for video:",
			todaysVideo.fields.Title,
			`(ID: ${todaysVideo.id})`,
		);

		setIsSubmitting(true);

		// Destroy the player first
		destroyPlayer();

		try {
			// Mark video as completed
			await upsertUserProgress({
				userRecordId: user.airtableRecord.id,
				videoRecordId: todaysVideo.id,
				WatchPercentage: 100,
				Status: "Completed",
			});

			// Refresh user progress to reflect the completion
			const updatedProgress = await fetchUserProgress(
				user.airtableRecord.fields.UserID,
			);
			setUserProgress(updatedProgress);

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
			setIsSubmitting(false);
		}
	}, [todaysVideo, user.airtableRecord, userResponses, destroyPlayer]);

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

	const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
		if (!user.airtableRecord) return;
		setIsSubmitting(true);
		try {
			const responses = Object.entries(answers).map(([questionId, answer]) => ({
				User: [user.airtableRecord?.id || ""],
				Question: [questionId],
				SelectedAnswer: answer,
			}));
			await submitUserResponses(responses);

			// Refresh user responses to reflect the new answers
			const updatedResponses = await fetchUserResponses(
				user.airtableRecord.fields.UserID,
			);
			setUserResponses(updatedResponses);

			setShowQuestionnaire(false);

			// Check if all Group B content is now completed
			const completed = await isGroupBCompleted(
				user.airtableRecord.fields.UserID,
				content,
			);

			if (completed) {
				navigate("/complete");
			}
		} catch (error) {
			console.error("Error submitting questionnaire:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				<Skeleton className="h-8 w-1/2" />
				<Skeleton className="h-6 w-1/4" />
				<Skeleton className="w-full h-96" />
			</div>
		);
	}

	// Show completion message if all videos up to current day are completed
	if (isTodaysVideoCompleted && !showQuestionnaire) {
		const nextDay = journeyDay + 1;
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
					<h2 className="text-2xl font-bold">Day {journeyDay} Complete!</h2>
					<p className="text-muted-foreground">
						{hasNextDay
							? `You have completed all videos up to Day ${journeyDay}. Please come back tomorrow for Day ${nextDay}.`
							: "Congratulations! You have completed all available content. Thank you for participating in the study."}
					</p>
				</div>
			</div>
		);
	}

	// Show access denied message if user hasn't completed previous days
	if (!canAccessCurrentDay && !showQuestionnaire) {
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
						{journeyDay}. Please complete the videos and questions for the
						previous days first.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Group B Dashboard</h1>
				<p className="text-muted-foreground">
					Day {journeyDay} of {totalDays}
				</p>
				{isFirstTime && (
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h3 className="font-semibold text-blue-900">
							Welcome to Day {journeyDay} of your study journey!
						</h3>
						<p className="text-blue-800 text-sm mt-1">
							You'll watch one video per day and answer questions. Each session
							takes about 5 minutes. Remember, videos can only be watched once,
							so make sure you're ready!
						</p>
					</div>
				)}
			</div>
			{!showQuestionnaire ? (
				todaysVideo ? (
					<div className="bg-card p-6 rounded-lg shadow">
						<h2 className="text-xl font-semibold mb-4">
							{todaysVideo.fields.Title}
						</h2>

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
									? `Click play to start Day ${journeyDay} video. Remember, it can only be watched once!`
									: "Video is playing. Please watch until the end to proceed to questions."}
							</p>
							{!videoStarted && (
								<div className="flex items-center justify-center text-sm text-muted-foreground">
									<Clock className="h-4 w-4 mr-1" />
									<span>Estimated time: ~5 minutes</span>
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="text-center p-10">
						<h2 className="text-2xl font-bold">
							No video for Day {journeyDay}.
						</h2>
						<p>Please check back later or contact support.</p>
					</div>
				)
			) : (
				<Questionnaire
					questions={questions}
					onSubmit={handleQuestionnaireSubmit}
					isLoading={isSubmitting}
				/>
			)}
			<div className="mt-8">
				<StudyTimeline currentDay={journeyDay} totalDays={totalDays} />
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
		</div>
	);
};

export default GroupBDashboard;
