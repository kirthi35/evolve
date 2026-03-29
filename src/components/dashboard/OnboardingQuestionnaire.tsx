import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      name: "",
      contact: "",
      age: "",
      gender: "",
      grade: "",
      instituteType: "",
      instituteName: "",
      specialty: "",
      yearsOfExperience: "",
      priorAIExposure: "",
      techComfortLevel: "",
      preTestKnowledge: {},
      acceptedTerms: false,
    },
  });

  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const acceptedTerms = watch("acceptedTerms", false);

  const handleFormSubmit = (data: OnboardingFormData) => {
    onSubmit(data);
  };

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

  const residencyYears = [
    { value: "first-year", label: "First Year" },
    { value: "second-year", label: "Second Year" },
    { value: "final-year", label: "Final Year" },
    { value: "consultant", label: "Consultant" },
  ];

  const instituteTypes = [
    { value: "medical-college", label: "Medical College" },
    { value: "hospital", label: "Hospital" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="px-4 md:px-6 py-6">
          <CardTitle className="text-xl md:text-2xl font-bold text-center leading-tight">
            Pre-Exposure Parameters Assessment
          </CardTitle>
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
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact" className="text-sm font-semibold">
                    Contact Number *
                  </Label>
                  <Input
                    id="contact"
                    type="number"
                    {...register("contact", {
                      required: "Contact number is required",
                    })}
                    className="mt-1"
                    placeholder="Enter your contact number"
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.contact.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="instituteType"
                    className="text-sm font-semibold"
                  >
                    Institute Type *
                  </Label>
                  <Controller
                    name="instituteType"
                    control={control}
                    rules={{ required: "Institute type is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Select institute type" />
                        </SelectTrigger>
                        <SelectContent>
                          {instituteTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.instituteType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.instituteType.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="instituteName"
                    className="text-sm font-semibold"
                  >
                    Institute Name *
                  </Label>
                  <Input
                    id="instituteName"
                    type="text"
                    {...register("instituteName", {
                      required: "Institute name is required",
                    })}
                    className="mt-1"
                    placeholder="Enter your institute name"
                  />
                  {errors.instituteName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.instituteName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="grade" className="text-sm font-semibold">
                    Grade *
                  </Label>
                  <Controller
                    name="grade"
                    control={control}
                    rules={{ required: "Grade is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Select your grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {residencyYears.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.grade && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.grade.message}
                    </p>
                  )}
                </div>
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
            {/* <div className="space-y-4">
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
						</div> */}

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
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2"
                    >
                      {aiExposureLevels.map((level) => (
                        <div
                          key={level.value}
                          className="flex items-start space-x-3 p-2 md:p-3 rounded-md border hover:bg-accent transition-colors"
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select technology comfort level" />
                      </SelectTrigger>
                      <SelectContent>
                        {techComfortLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {knowledgeQuestions.length > 0 && (
                <h3 className="text-base md:text-lg font-bold border-b-2 border-border pb-2 md:pb-3">
                  Pre-test Knowledge Assessment
                </h3>
              )}

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

            {/* Terms and Conditions + Submit */}
            <div className="pt-4 md:pt-6 border-t space-y-3">
              <div className="flex items-start gap-2">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  {...register("acceptedTerms", {
                    required: "You must accept terms and conditions",
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="acceptedTerms" className="text-sm">
                  I agree to the
                  <button
                    type="button"
                    onClick={() => setIsConsentOpen(true)}
                    className="ml-1 underline text-primary"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
              {errors.acceptedTerms && (
                <p className="text-sm text-red-600">
                  {errors.acceptedTerms.message}
                </p>
              )}

              <Dialog open={isConsentOpen} onOpenChange={setIsConsentOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Terms and Conditions</DialogTitle>
                    <DialogDescription>
                      Please read through the consent text before accepting.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <p>
                      By enrolling in the CLEAR Series (Clinical Lens to Explain AI — Relatably), I confirm that I am voluntarily participating in this educational program.
                    </p>
                    <p>
                      I understand that this is a complimentary learning initiative designed for radiology residents, and that successful completion of the course requirements may qualify me for a certificate of completion.
                    </p>
                    <p>
                      I acknowledge that my participation will involve engaging with short educational modules and responding to associated assessments. I understand that my responses and performance data may be used in an anonymized and aggregated manner for academic and educational purposes, with no personally identifiable information being disclosed.
                    </p>
                    <p>
                      I confirm that my participation is entirely voluntary.
                    </p>
                    <p>
                      By proceeding with enrollment, I provide my informed consent to participate under the above terms.
                    </p>
                  </div>
                  <div className="mt-4 text-right">
                    <DialogTrigger asChild>
                      <Button type="button">Close</Button>
                    </DialogTrigger>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="submit"
                disabled={isLoading || !acceptedTerms}
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
