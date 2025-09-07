import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { 
  fetchContentForGroup, 
  fetchQuestionsForVideo, 
  submitUserResponses, 
  updateUserProgress 
} from '../../services/airtableService';
import type { Content, Question, QuestionnaireFormData } from '../../types/airtable';
import Questionnaire from './Questionnaire';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const GroupADashboard: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  const currentVideo = content[currentVideoIndex];

  useEffect(() => {
    const loadContent = async () => {
      try {
        const groupAContent = await fetchContentForGroup('Group A');
        setContent(groupAContent);
      } catch (error) {
        console.error('Error loading Group A content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  useEffect(() => {
    if (playerReady && currentVideo && playerRef.current && !player) {
      const newPlayer = new window.YT.Player(playerRef.current, {
        height: '315',
        width: '560',
        videoId: currentVideo.fields.YouTubeVideoID,
        playerVars: {
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              // Start tracking progress
              const interval = setInterval(() => {
                if (newPlayer && newPlayer.getCurrentTime && newPlayer.getDuration) {
                  const currentTime = newPlayer.getCurrentTime();
                  const duration = newPlayer.getDuration();
                  const progress = (currentTime / duration) * 100;
                  setWatchProgress(progress);
                  
                  if (progress >= 90) {
                    clearInterval(interval);
                  }
                }
              }, 1000);
            }
          }
        }
      });
      setPlayer(newPlayer);
    }
  }, [playerReady, currentVideo, player]);

  const handleProceedToQuestions = async () => {
    if (!currentVideo || !user.uid) return;

    try {
      setIsSubmitting(true);
      
      // Update progress to 100%
      await updateUserProgress({
        UserID: user.uid,
        VideoID: currentVideo.id,
        WatchProgress: 100,
        Completed: true
      });

      // Fetch questions for current video
      const questions = await fetchQuestionsForVideo(currentVideo.id);
      setCurrentQuestions(questions);
      setShowQuestionnaire(true);
    } catch (error) {
      console.error('Error proceeding to questions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionnaireSubmit = async (answers: QuestionnaireFormData) => {
    if (!currentVideo || !user.uid) return;

    try {
      setIsSubmitting(true);

      // Submit responses
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        UserID: user.uid!,
        QuestionID: questionId,
        Answer: answer,
        VideoID: currentVideo.id
      }));

      await submitUserResponses(responses);

      // Move to next video or complete
      if (currentVideoIndex < content.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
        setWatchProgress(0);
        setShowQuestionnaire(false);
        setCurrentQuestions([]);
        setPlayer(null);
      } else {
        // All videos completed
        navigate('/complete');
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Content Available</h2>
          <p className="mt-2 text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Group A Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Video {currentVideoIndex + 1} of {content.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            {!showQuestionnaire ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentVideo?.fields.Title}
                </h2>
                
                <div className="mb-4">
                  <div ref={playerRef}></div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(watchProgress, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Watch progress: {Math.round(watchProgress)}%
                  </p>
                </div>

                <button
                  onClick={handleProceedToQuestions}
                  disabled={watchProgress < 90 || isSubmitting}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Questions'}
                </button>
              </div>
            ) : (
              <Questionnaire
                questions={currentQuestions}
                onSubmit={handleQuestionnaireSubmit}
                isLoading={isSubmitting}
              />
            )}
          </div>

          {/* Upcoming Videos Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upcoming Videos
              </h3>
              <div className="space-y-3">
                {content.map((video, index) => (
                  <div
                    key={video.id}
                    className={`p-3 rounded-md border ${
                      index === currentVideoIndex
                        ? 'border-indigo-500 bg-indigo-50'
                        : index < currentVideoIndex
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-sm text-gray-900">
                      {index + 1}. {video.fields.Title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {index < currentVideoIndex
                        ? 'Completed'
                        : index === currentVideoIndex
                        ? 'Current'
                        : 'Locked'
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupADashboard;
