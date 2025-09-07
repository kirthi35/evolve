import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

const AdminUploadPage = () => {
  const [videoLink, setVideoLink] = useState('');
  const [group, setGroup] = useState('groupA');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', ''], correctAnswer: 0 },
  ]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="videoLink">Video Link</Label>
            <Input
              id="videoLink"
              placeholder="Enter video link"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
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

          <Button type="submit" className="w-full">Upload Content</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminUploadPage;
