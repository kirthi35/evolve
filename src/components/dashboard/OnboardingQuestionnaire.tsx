import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { OnboardingFormData } from "../../types/airtable";
import type { QuestionWithAnswerOptions } from "./Questionnaire";

interface OnboardingQuestionnaireProps {
	onSubmit: (data: OnboardingFormData) => void;
	isLoading?: boolean;
	knowledgeQuestions: QuestionWithAnswerOptions[]; // Questions are now passed as a prop
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({
	onSubmit,
	isLoading = false,
	knowledgeQuestions = [],
}) => {
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<OnboardingFormData>({
		defaultValues: {
			preTestKnowledge: {},
		},
	});

	const handleFormSubmit = (data: OnboardingFormData) => {
		onSubmit(data);
	};

	const specialties = [
		"Internal Medicine",
		"Surgery",
		"Pediatrics",
		"Obstetrics & Gynecology",
		"Psychiatry",
		"Radiology",
		"Anesthesiology",
		"Emergency Medicine",
		"Family Medicine",
		"Dermatology",
		"Ophthalmology",
		"Orthopedics",
		"Cardiology",
		"Neurology",
		"Oncology",
		"Pathology",
		"Other",
	];

	const experienceRanges = [
		{ value: "<1", label: "<1 year (Interns/fresh grads)" },
		{ value: "1-5", label: "1–5 years (Early career)" },
		{ value: "6-10", label: "6–10 years (Mid-career)" },
		{ value: ">10", label: ">10 years (Senior consultants)" },
	];

	const aiExposureLevels = [
		{ value: "none", label: "None - Never interacted with AI in any form" },
		{
			value: "minimal",
			label: "Minimal - Watched YouTube videos or followed AI-related news",
		},
		{
			value: "moderate",
			label:
				"Moderate - Attended webinars, CMEs, or read articles about AI in medicine",
		},
		{
			value: "high",
			label:
				"High - Completed formal course (>10 hours) or contributed to AI-based project",
		},
	];

	const techComfortLevels = [
		{ value: "1", label: "1 - Very uncomfortable" },
		{ value: "2", label: "2 - Somewhat uncomfortable" },
		{ value: "3", label: "3 - Neutral" },
		{ value: "4", label: "4 - Somewhat comfortable" },
		{ value: "5", label: "5 - Very comfortable" },
	];

	return (
		<div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
			<Card>
				<CardHeader className="px-4 md:px-6 py-6">
					<CardTitle className="text-xl md:text-2xl font-bold text-center leading-tight">
						Pre-Exposure Parameters Assessment
					</CardTitle>
					<p className="text-center text-muted-foreground text-sm md:text-base mt-3 leading-relaxed">
						Please provide the following information to help us understand your
						background and tailor your experience.
					</p>
				</CardHeader>
				<CardContent className="px-4 md:px-6">
					<form
						onSubmit={handleSubmit(handleFormSubmit)}
						className="space-y-6 md:space-y-8"
					>
						{/* Demographics Section */}
						<div className="space-y-4">
							<h3 className="text-base md:text-lg font-bold border-b-2 border-border pb-2 md:pb-3">
								Demographics
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="age" className="text-sm font-semibold">
										Age *
									</Label>
									<Input
										id="age"
										type="number"
										{...register("age", { required: "Age is required" })}
										className="mt-1"
										placeholder="Enter your age"
									/>
									{errors.age && (
										<p className="mt-1 text-sm text-red-600">
											{errors.age.message}
										</p>
									)}
								</div>
								<div>
									<Label htmlFor="gender" className="text-sm font-semibold">
										Gender *
									</Label>
									<Controller
										name="gender"
										control={control}
										rules={{ required: "Gender is required" }}
										render={({ field }) => (
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger className="mt-1 w-full">
													<SelectValue placeholder="Select gender" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="male">Male</SelectItem>
													<SelectItem value="female">Female</SelectItem>
													<SelectItem value="other">Other</SelectItem>
													<SelectItem value="prefer-not-to-say">
														Prefer not to say
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									{errors.gender && (
										<p className="mt-1 text-sm text-red-600">
											{errors.gender.message}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Professional Information Section */}
						<div className="space-y-4">
							<h3 className="text-base md:text-lg font-bold border-b-2 border-border pb-2 md:pb-3">
								Professional Information
							</h3>
							<div>
								<Label htmlFor="specialty" className="text-sm font-semibold">
									Clinical Specialty *
								</Label>
								<Controller
									name="specialty"
									control={control}
									rules={{ required: "Specialty is required" }}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger className="mt-1 w-full">
												<SelectValue placeholder="Select your specialty" />
											</SelectTrigger>
											<SelectContent>
												{specialties.map((specialty) => (
													<SelectItem key={specialty} value={specialty}>
														{specialty}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.specialty && (
									<p className="mt-1 text-sm text-red-600">
										{errors.specialty.message}
									</p>
								)}
							</div>
							<div>
								<Label className="text-sm font-semibold">
									Years of Experience *
								</Label>
								<Controller
									name="yearsOfExperience"
									control={control}
									rules={{ required: "Years of experience is required" }}
									render={({ field }) => (
										<RadioGroup
											onValueChange={field.onChange}
											value={field.value}
											className="mt-2"
										>
											{experienceRanges.map((range) => (
												<div
													key={range.value}
													className="flex items-start space-x-3 p-2 md:p-3 rounded-md hover:bg-accent transition-colors"
												>
													<RadioGroupItem
														value={range.value}
														id={`experience-${range.value}`}
													/>
													<Label
														htmlFor={`experience-${range.value}`}
														className="font-medium text-sm md:text-base leading-relaxed cursor-pointer flex-1"
													>
														{range.label}
													</Label>
												</div>
											))}
										</RadioGroup>
									)}
								/>
								{errors.yearsOfExperience && (
									<p className="mt-1 text-sm text-red-600">
										{errors.yearsOfExperience.message}
									</p>
								)}
							</div>
						</div>

						{/* AI Exposure Section */}
						<div className="space-y-4">
							<h3 className="text-base md:text-lg font-bold border-b-2 border-border pb-2 md:pb-3">
								Prior AI Exposure
							</h3>
							<div>
								<Label className="text-sm font-semibold">
									Prior AI Exposure Classification *
								</Label>
								<Controller
									name="priorAIExposure"
									control={control}
									rules={{ required: "AI exposure level is required" }}
									render={({ field }) => (
										<RadioGroup
											onValueChange={field.onChange}
											value={field.value}
											className="mt-2"
										>
											{aiExposureLevels.map((level) => (
												<div
													key={level.value}
													className="flex items-start space-x-3 p-2 md:p-3 rounded-md hover:bg-accent transition-colors"
												>
													<RadioGroupItem
														value={level.value}
														id={`ai-exposure-${level.value}`}
														className="mt-1"
													/>
													<div className="flex-1">
														<Label
															htmlFor={`ai-exposure-${level.value}`}
															className="font-semibold text-sm md:text-base cursor-pointer block"
														>
															{level.label.split(" - ")[0]}
														</Label>
														<p className="text-muted-foreground text-xs md:text-sm mt-1 leading-relaxed">
															{level.label.split(" - ")[1]}
														</p>
													</div>
												</div>
											))}
										</RadioGroup>
									)}
								/>
								{errors.priorAIExposure && (
									<p className="mt-1 text-sm text-red-600">
										{errors.priorAIExposure.message}
									</p>
								)}
							</div>
							<div>
								<Label className="text-sm font-semibold">
									Technology Comfort Level (1-5 scale) *
								</Label>
								<Controller
									name="techComfortLevel"
									control={control}
									rules={{ required: "Tech comfort level is required" }}
									render={({ field }) => (
										<RadioGroup
											onValueChange={field.onChange}
											value={field.value}
											className="mt-2"
										>
											{techComfortLevels.map((level) => (
												<div
													key={level.value}
													className="flex items-start space-x-3 p-2 md:p-3 rounded-md hover:bg-accent transition-colors"
												>
													<RadioGroupItem
														value={level.value}
														id={`tech-comfort-${level.value}`}
													/>
													<Label
														htmlFor={`tech-comfort-${level.value}`}
														className="font-medium text-sm md:text-base leading-relaxed cursor-pointer flex-1"
													>
														{level.label}
													</Label>
												</div>
											))}
										</RadioGroup>
									)}
								/>
								{errors.techComfortLevel && (
									<p className="mt-1 text-sm text-red-600">
										{errors.techComfortLevel.message}
									</p>
								)}
							</div>
						</div>

						{/* Pre-test Knowledge Section (now dynamic) */}
						<div className="space-y-4">
							<h3 className="text-base md:text-lg font-bold border-b-2 border-border pb-2 md:pb-3">
								Pre-test Knowledge Assessment
							</h3>

							<div className="space-y-6">
								{knowledgeQuestions.map((q, index) => (
									<div
										key={q.id}
										className="border border-border rounded-lg p-3 md:p-4 bg-card"
									>
										<h4 className="text-sm md:text-base font-semibold mb-3 md:mb-4 leading-tight">
											{index + 1}. {q.fields.QuestionText}
										</h4>
										<Controller
											name={`preTestKnowledge.${q.id}`}
											control={control}
											rules={{ required: "Please select an answer" }}
											render={({ field }) => (
												<RadioGroup
													onValueChange={field.onChange}
													value={field.value}
													className="mt-2"
												>
													{q.answerOptions.map((option, optionIndex) => (
														<div
															key={option.id}
															className="flex items-start space-x-3 p-2 md:p-3 rounded-md hover:bg-accent transition-colors"
														>
															<RadioGroupItem
																value={option.fields.OptionText}
																id={`${q.id}-${optionIndex}`}
															/>
															<Label
																htmlFor={`${q.id}-${optionIndex}`}
																className="font-medium text-sm md:text-base leading-relaxed cursor-pointer flex-1"
															>
																{option.fields.OptionText}
															</Label>
														</div>
													))}
												</RadioGroup>
											)}
										/>
										{errors.preTestKnowledge?.[q.id] && (
											<p className="mt-2 text-sm text-red-600">
												Please select an answer.
											</p>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Submit Button */}
						<div className="pt-4 md:pt-6 border-t">
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full py-3 md:py-4 text-base md:text-lg font-medium"
							>
								{isLoading ? "Submitting..." : "Complete Onboarding"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default OnboardingQuestionnaire;
