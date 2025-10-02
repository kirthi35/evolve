import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import type {
	Question,
	QuestionnaireFormData,
	AnswerOption,
} from "../../types/airtable";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

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
	isLoading = false,
}) => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<QuestionnaireFormData>();

	const handleFormSubmit = (data: QuestionnaireFormData) => {
		onSubmit(data);
	};

	const answerOptions = useMemo(() => {
		return questions.map((question) =>
			[
				question.fields.OptionA,
				question.fields.OptionB,
				question.fields.OptionC,
				question.fields.OptionD,
			].filter(Boolean),
		); // Filter out any null/undefined options
	}, [questions]);

	console.log("answerOptions", questions, answerOptions);

	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">
					Please answer the following questions:
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(handleFormSubmit)} className="divide-y">
					{questions.map((question, index) => (
						<div key={question.id} className="space-y-4 p-4">
							<div className="pb-4 space-y-2">
								<p className="text-sm text-muted-foreground font-medium">
									Question of {index + 1} of {questions.length}
								</p>
								<h4 className="text-sm md:text-base font-medium leading-tight">
									{question.fields.QuestionText}
								</h4>
							</div>

							<Controller
								name={question.id}
								control={control}
								rules={{ required: "Please select an answer" }}
								render={({ field }) => (
									<RadioGroup
										value={field.value}
										onValueChange={field.onChange}
										className="space-y-2 md:space-y-3"
									>
										{answerOptions[index]?.map((option) => (
											<div
												key={option}
												className="flex items-start space-x-3 p-2 border border-border rounded-lg hover:bg-accent transition-colors"
											>
												<RadioGroupItem
													value={option}
													id={`${question.id}-${option}`}
													className="mt-1"
												/>
												<Label
													htmlFor={`${question.id}-${option}`}
													className="text-xs md:text-sm font-normal cursor-pointer flex-1 leading-relaxed"
												>
													{option}
												</Label>
											</div>
										))}
									</RadioGroup>
								)}
							/>

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
							{isLoading ? "Submitting..." : "Submit Answers"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};

export default Questionnaire;
