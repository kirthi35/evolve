import React from 'react';
import { useForm } from 'react-hook-form';
import type { Question, QuestionnaireFormData, AnswerOption } from '../../types/airtable';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

// Define a new type that combines a question with its answer options
export interface QuestionWithAnswerOptions extends Question {
  answerOptions: AnswerOption[];
}

interface QuestionnaireProps {
  questions: QuestionWithAnswerOptions[];
  onSubmit: (answers: QuestionnaireFormData) => void;
  isLoading?: boolean;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ 
  questions, 
  onSubmit, 
  isLoading = false 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<QuestionnaireFormData>();

  const handleFormSubmit = (data: QuestionnaireFormData) => {
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl">Please answer the following questions:</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3 md:space-y-4 p-4 border border-border rounded-lg bg-card">
              <h4 className="text-sm md:text-base font-medium leading-tight">
                {index + 1}. {question.fields.QuestionText}
              </h4>

              <RadioGroup
                value={question.id}
                className="space-y-2 md:space-y-3"
              >
                {question.answerOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-3 p-2 rounded hover:bg-accent transition-colors">
                    <RadioGroupItem
                      {...register(question.id, {
                        required: 'Please select an answer'
                      })}
                      value={option.fields.OptionText}
                      id={`${question.id}-${option.id}`}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={`${question.id}-${option.id}`}
                      className="text-xs md:text-sm font-normal cursor-pointer flex-1 leading-relaxed"
                    >
                      {option.fields.OptionText}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {errors[question.id] && (
                <p className="text-xs md:text-sm text-destructive">
                  {errors[question.id]?.message}
                </p>
              )}
            </div>
          ))}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm md:text-base"
            >
              {isLoading ? 'Submitting...' : 'Submit Answers'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Questionnaire;
