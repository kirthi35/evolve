import React, { useState } from 'react';
import { createContent, createQuestion } from '../services/airtableService';

type Question = {
  text: string;
  type: 'multiple-choice' | 'free-text';
  options?: string[];
};

const AdminUploadPage: React.FC = () => {
  const [videoLink, setVideoLink] = useState('');
  const [group, setGroup] = useState<'Group A' | 'Group B'>('Group A');
  const [questions, setQuestions] = useState<Question[]>([{ text: '', type: 'multiple-choice', options: [''] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', type: 'multiple-choice', options: [''] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  const handleQuestionTypeChange = (index: number, type: 'multiple-choice' | 'free-text') => {
    const newQuestions = [...questions];
    newQuestions[index].type = type;
    if (type === 'multiple-choice' && !newQuestions[index].options) {
      newQuestions[index].options = [''];
    } else if (type === 'free-text') {
      delete newQuestions[index].options;
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
      newQuestions[qIndex].options[oIndex] = text;
      setQuestions(newQuestions);
    }
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
      newQuestions[qIndex].options.push('');
      setQuestions(newQuestions);
    }
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
      newQuestions[qIndex].options.splice(oIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Create the content record
      const contentData = {
        Name: videoLink.split('/').pop() || 'New Video',
        Group: group,
        Type: 'Video' as const,
        URL: videoLink,
        Order: 1 // This might need to be dynamic in a real app
      };
      const newContent = await createContent(contentData);

      // 2. Create the question records
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionData = {
          Text: q.text,
          Type: q.type,
          Video: [newContent.id],
          Order: i + 1,
          Options: q.options ? q.options.join(', ') : undefined
        };
        await createQuestion(questionData);
      }

      setSuccess('Content and questions uploaded successfully!');
      // Reset form
      setVideoLink('');
      setGroup('Group A');
      setQuestions([{ text: '', type: 'multiple-choice', options: [''] }]);
    } catch (err) {
      setError('Failed to upload content. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Content</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a video link and associated questions for a user group.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Video Link */}
          <div className="mb-6">
            <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 mb-1">
              Video Link
            </label>
            <input
              type="url"
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/video.mp4"
              required
            />
          </div>

          {/* Group */}
          <div className="mb-6">
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Group
            </label>
            <select
              id="group"
              value={group}
              onChange={(e) => setGroup(e.target.value as 'Group A' | 'Group B')}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Group A">Group A</option>
              <option value="Group B">Group B</option>
            </select>
          </div>

          {/* Questions */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Questions</h2>
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="mb-6 p-4 border border-gray-200 rounded-lg relative">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Question {qIndex + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                <textarea
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter question text"
                  required
                  rows={2}
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as 'multiple-choice' | 'free-text')}
                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="free-text">Free Text</option>
                  </select>
                </div>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Options</h4>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      + Add Option
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add Another Question
            </button>
          </div>

          {/* Submission and Status */}
          <div className="mt-8 border-t pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Content'}
              </button>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUploadPage;
