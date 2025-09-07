import React from 'react';
import { useForm } from 'react-hook-form';
import type { Question, QuestionnaireFormData, AnswerOption } from '../../types/airtable';

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
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Please answer the following questions:
      </h3>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
            <h4 className="text-base font-medium text-gray-900 mb-4">
              {index + 1}. {question.fields.QuestionText}
            </h4>

            <div className="space-y-3">
              {question.answerOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                >
                  <input
                    {...register(question.id, {
                      required: 'Please select an answer'
                    })}
                    type="radio"
                    value={option.fields.OptionText}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-gray-700">{option.fields.OptionText}</span>
                </label>
              ))}
            </div>

            {errors[question.id] && (
              <p className="mt-2 text-sm text-red-600">
                {errors[question.id]?.message}
              </p>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Questionnaire;
