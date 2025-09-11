import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createContent, createQuestion } from '../../services/airtableService';

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

interface AdminUploadModalProps {
  onContentAdded: () => void;
}

const AdminUploadModal: React.FC<AdminUploadModalProps> = ({ onContentAdded }) => {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [group, setGroup] = useState<'groupA' | 'groupB'>('groupA');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoLink || !videoTitle) {
      setErrorMessage('Please fill in all required fields');
      setSubmitStatus('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');

      // Extract YouTube video ID for validation
      const youtubeVideoId = extractYouTubeVideoId(videoLink);
      if (!youtubeVideoId) {
        throw new Error(`Invalid YouTube URL. Please use a valid YouTube link like:
        • https://www.youtube.com/watch?v=VIDEO_ID
        • https://youtu.be/VIDEO_ID
        • https://www.youtube.com/shorts/VIDEO_ID`);
      }

      // Create content in Airtable
      const contentData = {
        Title: videoTitle,
        TargetGroup: group === 'groupA' ? 'Group A' as const : 'Group B' as const,
        YouTubeURL: videoLink,
        Order: 0
      };

      const createdContent = await createContent(contentData);

      // Create questions in Airtable
      const questionPromises = questions
        .filter(q => q.text.trim() !== '')
        .map(async (question) => {
          const validOptions = question.options.filter(opt => opt.trim() !== '');
          const questionData = {
            QuestionText: question.text,
            LinkedVideo: [createdContent.id],
            OptionA: validOptions[0] || '',
            OptionB: validOptions[1] || '',
            OptionC: validOptions[2] || '',
            OptionD: validOptions[3] || ''
          };

          return await createQuestion(questionData);
        });

      await Promise.all(questionPromises);

      setSubmitStatus('success');
      
      // Reset form
      setVideoTitle('');
      setVideoLink('');
      setGroup('groupA');
      setQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: '' }]);
      
      // Notify parent component
      setTimeout(() => {
        onContentAdded();
      }, 1500);

    } catch (error) {
      console.error('Error uploading content:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Video Information */}
      <Card>
        <CardHeader>
          <CardTitle>Video Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoTitle">Video Title *</Label>
            <Input
              id="videoTitle"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoLink">YouTube URL *</Label>
            <Input
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="text-sm text-muted-foreground">
              Supports regular YouTube videos, Shorts, and youtu.be links
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Target Group *</Label>
            <Select value={group} onValueChange={(value: 'groupA' | 'groupB') => setGroup(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groupA">Group A</SelectItem>
                <SelectItem value="groupB">Group B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, qIndex) => (
            <Card key={qIndex} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Input
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    placeholder="Enter your question"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <Label className="w-8 text-sm font-medium">
                          {String.fromCharCode(65 + optIndex)}:
                        </Label>
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={question.correctAnswer}
                    onValueChange={(value) => updateQuestion(qIndex, 'correctAnswer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, optIndex) => (
                        option.trim() && (
                          <SelectItem key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                            {String.fromCharCode(65 + optIndex)}: {option}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button and Status */}
      <div className="space-y-4">
        {submitStatus === 'success' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Content uploaded successfully!</span>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Content'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AdminUploadModal;
