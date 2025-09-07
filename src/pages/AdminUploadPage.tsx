import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createContent, createQuestion } from '../services/airtableService';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

const AdminUploadPage = () => {
  const [videoLink, setVideoLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [group, setGroup] = useState('groupA');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', ''], correctAnswer: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = oIndex;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''], correctAnswer: 0 }]);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      // YouTube Shorts: youtube.com/shorts/VIDEO_ID
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      // Regular YouTube: youtube.com/watch?v=VIDEO_ID
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // YouTube embed: youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // YouTube short URL: youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // YouTube with additional parameters
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoLink || !videoTitle) {
      setSubmitStatus('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');

      // Extract YouTube video ID
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
        TargetGroup: group === 'groupA' ? 'Group A' : 'Group B',
        YouTubeURL: videoLink, // Store the full URL, not just the video ID
        Order: 0 // You might want to implement ordering logic
      };

      const createdContent = await createContent(contentData);

      // Create questions in Airtable
      const questionPromises = questions
        .filter(q => q.text.trim() !== '') // Only create questions with text
        .map(async (question, index) => {
          // Map dynamic options to fixed A, B, C, D structure
          const validOptions = question.options.filter(opt => opt.trim() !== '');
          const questionData = {
            QuestionText: question.text,
            LinkedVideo: [createdContent.id], // Link to the created content
            OptionA: validOptions[0] || '',
            OptionB: validOptions[1] || '',
            OptionC: validOptions[2] || '',
            OptionD: validOptions[3] || ''
          };

          return await createQuestion(questionData);
        });

      const createdQuestions = await Promise.all(questionPromises);

      setSubmitStatus('success');
      
      // Reset form
      setVideoLink('');
      setVideoTitle('');
      setGroup('groupA');
      setQuestions([{ text: '', options: ['', ''], correctAnswer: 0 }]);

    } catch (error) {
      console.error('Error uploading content:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="videoTitle">Video Title *</Label>
            <Input
              id="videoTitle"
              placeholder="Enter video title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoLink">YouTube Video Link *</Label>
            <Input
              id="videoLink"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Group</Label>
            <RadioGroup
              value={group}
              onValueChange={setGroup}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="groupA" id="groupA" />
                <Label htmlFor="groupA">Group A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="groupB" id="groupB" />
                <Label htmlFor="groupB">Group B</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Questions</Label>
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="p-4 border rounded-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`question-${qIndex}`}>Question {qIndex + 1}</Label>
                  <Input
                    id={`question-${qIndex}`}
                    placeholder="Enter the question"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2">
                      <RadioGroup
                        value={question.correctAnswer.toString()}
                        onValueChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                      >
                        <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                      </RadioGroup>
                      <Input
                        id={`q${qIndex}-o${oIndex}-text`}
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                    Add Option
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" onClick={addQuestion}>
              Add Question
            </Button>
          </div>

          <Separator />

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">✅ Content uploaded successfully!</p>
              <p className="text-green-600 text-sm">Video and questions have been saved to Airtable.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">❌ Upload failed</p>
              <p className="text-red-600 text-sm">Please check your input and try again.</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : 'Upload Content'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminUploadPage;
