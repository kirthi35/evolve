import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import {
  fetchContentForGroup,
  fetchQuestionsForVideo,
  fetchAnswerOptions,
  submitUserResponses,
  upsertUserProgress,
  fetchUserProgress,
} from '../../services/airtableService';
import type { ContentItem, UserProgress, QuestionnaireFormData } from '../../types/airtable';
import Questionnaire, { type QuestionWithAnswerOptions } from './Questionnaire';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import StudyTimeline from './StudyTimeline';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Play, Clock, AlertTriangle } from 'lucide-react';

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

const GroupBDashboard: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswerOptions[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Callback ref to ensure we know when the element is available
  const setPlayerRef = (element: HTMLDivElement | null) => {
    playerRef.current = element;
    if (element) {
      console.log('GroupB: Player ref element is now available');
    }
  };
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  // Function to extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      // Handle youtu.be short URLs
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.substring(1); // Remove the leading '/'
      }
      
      // Handle youtube.com URLs
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        // Standard watch URLs
        const vParam = urlObj.searchParams.get('v');
        if (vParam) return vParam;
        
        // Handle /embed/ URLs
        if (urlObj.pathname.startsWith('/embed/')) {
          return urlObj.pathname.substring(7); // Remove '/embed/'
        }
        
        // Handle /shorts/ URLs
        if (urlObj.pathname.startsWith('/shorts/')) {
          return urlObj.pathname.substring(8); // Remove '/shorts/'
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting YouTube video ID:', error);
      return '';
    }
  };

  const getDaysSince = (dateString?: string): number => {
    if (!dateString) return 0;
    const givenDate = new Date(dateString);
    const today = new Date();
    givenDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - givenDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const journeyDay = useMemo(() => {
    const day = getDaysSince(user.airtableRecord?.createdTime) + 1;
    console.log('GroupB: Journey day calculated:', day, 'from createdTime:', user.airtableRecord?.createdTime);
    return day;
  }, [user.airtableRecord]);
  
  const todaysVideo = useMemo(() => {
    console.log('GroupB: Looking for video with Order:', journeyDay);
    console.log('GroupB: Available content:', content.map(c => ({ id: c.id, title: c.fields.Title, releaseDay: c.fields.ReleaseDay, order: c.fields.Order })));
    
    // Try ReleaseDay first (if it exists), then fall back to Order
    let video = content.find(c => c.fields.ReleaseDay === journeyDay);
    if (!video) {
      console.log('GroupB: ReleaseDay not found, trying Order field...');
      video = content.find(c => c.fields.Order === journeyDay);
    }
    
    console.log('GroupB: Found video for today:', video ? { id: video.id, title: video.fields.Title, order: video.fields.Order } : 'None');
    return video;
  }, [content, journeyDay]);
  const isTodaysVideoCompleted = useMemo(() => {
    if (!todaysVideo) return false;
    return userProgress.some(p => p.fields.Video?.[0] === todaysVideo.id && p.fields.Status === 'Completed');
  }, [userProgress, todaysVideo]);
  const totalDays = useMemo(() => Math.max(...content.map(c => c.fields.Order || 0), 7), [content]);
  const isFirstTime = useMemo(() => {
    return userProgress.length === 0; // No progress records means first time
  }, [userProgress]);

  useEffect(() => {
    const loadData = async () => {
      if (!user.airtableRecord) return;
      setIsLoading(true);
      try {
        console.log('GroupB: Loading data for user:', user.airtableRecord.id);
        const [groupBContent, progressRecords] = await Promise.all([
          fetchContentForGroup('Group B'),
          fetchUserProgress(user.airtableRecord.id),
        ]);
        console.log('GroupB: Raw content loaded:', groupBContent);
        console.log('GroupB: User progress loaded:', progressRecords);
        setContent(groupBContent.sort((a, b) => (a.fields.Order || 0) - (b.fields.Order || 0)));
        setUserProgress(progressRecords);
      } catch (error) {
        console.error('Error loading Group B data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user.airtableRecord?.id) {
      loadData();
    }
  }, [user.airtableRecord]);

  useEffect(() => {
    console.log('GroupB: YouTube API useEffect triggered, window.YT exists:', !!window.YT);
    
    if (!window.YT) {
      console.log('GroupB: Loading YouTube API script');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        console.log('GroupB: YouTube API is ready');
      };
    } else {
      console.log('GroupB: YouTube API already loaded');
    }
    
    // Cleanup function to destroy player when component unmounts
    return () => {
      if (player && player.destroy) {
        console.log('GroupB: Destroying player on cleanup');
        player.destroy();
      }
    };
  }, [player]);

  const createPlayer = () => {
    console.log('GroupB: createPlayer called', { 
      todaysVideo: !!todaysVideo, 
      windowYT: !!window.YT, 
      YTPlayer: !!(window.YT && window.YT.Player),
      playerRefCurrent: !!playerRef.current 
    });
    
    if (!todaysVideo) {
      console.error('GroupB: No todaysVideo available');
      return;
    }
    
    if (!window.YT || !window.YT.Player) {
      console.error('GroupB: YouTube API not ready');
      return;
    }
    
    if (!playerRef.current) {
      console.error('GroupB: playerRef.current is null');
      return;
    }
    
    const videoId = extractYouTubeVideoId(todaysVideo.fields.YouTubeURL);
    console.log('GroupB: Extracted video ID:', videoId, 'from URL:', todaysVideo.fields.YouTubeURL);
    
    if (!videoId) {
      console.error('GroupB: Could not extract video ID from URL:', todaysVideo.fields.YouTubeURL);
      setIsVideoLoading(false);
      return;
    }
    
    console.log('GroupB: Creating YouTube player');
    setIsVideoLoading(true);
    
    try {
      const newPlayer = new window.YT.Player(playerRef.current, {
        height: '315', width: '560',
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, showinfo: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3 },
        events: { 
          onReady: () => {
            console.log('GroupB: YouTube player ready');
            setIsVideoLoading(false);
            setVideoStarted(true);
          },
          onStateChange: (event: any) => {
            console.log('GroupB: Player state changed:', event.data);
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log('GroupB: Video ended, handling completion');
              handleVideoComplete();
            }
          },
          onError: (error: any) => {
            console.error('GroupB: YouTube player error:', error);
            setIsVideoLoading(false);
          }
        },
      });
      setPlayer(newPlayer);
      console.log('GroupB: YouTube player created successfully');
    } catch (error) {
      console.error('GroupB: Error creating YouTube player:', error);
      setIsVideoLoading(false);
    }
  };

  const destroyPlayer = () => {
    if (player && player.destroy) {
      player.destroy();
      setPlayer(null);
      setVideoStarted(false);
    }
  };

  const handlePlayVideo = () => {
    setShowWarningDialog(true);
  };

  const handleConfirmPlay = () => {
    console.log('GroupB: User confirmed play, closing dialog');
    setShowWarningDialog(false);
    
    // Add a small delay to ensure the DOM element is ready after dialog closes
    setTimeout(() => {
      console.log('GroupB: Attempting to create player after dialog close');
      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        console.error('GroupB: YouTube API not ready in handleConfirmPlay');
      }
    }, 100);
  };

  const handleCancelPlay = () => {
    setShowWarningDialog(false);
  };

  const handleVideoComplete = async () => {
    if (!todaysVideo || !user.airtableRecord) return;
    setIsSubmitting(true);
    
    // Destroy the player first
    destroyPlayer();
    
    try {
      await upsertUserProgress({
        userRecordId: user.airtableRecord.id,
        videoRecordId: todaysVideo.id,
        WatchPercentage: 100,
        Status: 'Completed',
      });
      const fetchedQuestions = await fetchQuestionsForVideo(todaysVideo.id);
      if (fetchedQuestions.length > 0) {
        const optionIds = fetchedQuestions.flatMap(q => q.fields.AnswerOptions || []);
        const options = await fetchAnswerOptions(optionIds);
        const questionsWithOptions = fetchedQuestions.map(q => ({
          ...q,
          answerOptions: options.filter(opt => q.fields.AnswerOptions?.includes(opt.id)),
        }));
        setQuestions(questionsWithOptions);
        setShowQuestionnaire(true);
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Error handling video completion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
    if (!user.airtableRecord) return;
    setIsSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        User: [user.airtableRecord!.id],
        Question: [questionId],
        SelectedAnswer: answer,
      }));
      await submitUserResponses(responses);
      if (journeyDay >= totalDays) {
        navigate('/complete');
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
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

  if (journeyDay > totalDays) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold">Study Complete!</h2>
        <p>You have completed all days of the study.</p>
        <Button onClick={() => navigate('/complete')} className="mt-4">View Completion Page</Button>
      </div>
    );
  }

  if (isTodaysVideoCompleted && !showQuestionnaire) {
    return (
      <div className="text-center p-10">
        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground">
            You have completed Day {journeyDay}. Please come back tomorrow for your next video.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Group B Dashboard</h1>
        <p className="text-muted-foreground">Day {journeyDay} of {totalDays}</p>
        {isFirstTime && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900">Welcome to your study journey!</h3>
            <p className="text-blue-800 text-sm mt-1">
              You'll watch one video per day and answer questions. Each session takes about 5 minutes.
              Remember, videos can only be watched once, so make sure you're ready!
            </p>
          </div>
        )}
      </div>
      {!showQuestionnaire ? (
        todaysVideo ? (
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{todaysVideo.fields.Title}</h2>
            
            {!videoStarted && !isVideoLoading ? (
              // Show video thumbnail with play button
              <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
                {(() => {
                  const videoId = extractYouTubeVideoId(todaysVideo.fields.YouTubeURL);
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
            ) : isVideoLoading ? (
              // Show loading state
              <div className="w-full aspect-video bg-black rounded flex items-center justify-center">
                <div className="text-white text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                  <p>Loading video...</p>
                </div>
              </div>
            ) : (
              // Show actual video player
              <div ref={setPlayerRef} className="w-full aspect-video bg-black rounded" />
            )}
            
            <div className="mt-4 space-y-2">
              <p className="text-center text-muted-foreground">
                {!videoStarted 
                  ? "Click play to start today's video. Remember, it can only be watched once!" 
                  : "Video is playing. Please watch until the end to proceed to questions."
                }
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
            <h2 className="text-2xl font-bold">No video for today.</h2>
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
                <li>• This video can only be watched <strong>once</strong> and cannot be replayed</li>
                <li>• Please ensure you are in a quiet environment and ready to focus</li>
                <li>• You will need to answer questions after the video</li>
                <li>• The entire process should take no more than 5 minutes</li>
              </ul>
              <p className="text-sm font-medium text-amber-700 bg-amber-50 p-3 rounded-lg">
                Make sure you are positioned to watch the video and answer the questions that follow.
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
