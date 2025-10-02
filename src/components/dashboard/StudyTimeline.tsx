import React from "react";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";

interface StudyTimelineProps {
	currentDay: number;
	totalDays: number;
}

const StudyTimeline: React.FC<StudyTimelineProps> = ({
	currentDay,
	totalDays,
}) => {
	const progressPercentage = Math.min((currentDay / totalDays) * 100, 100);

	return (
		<Card className="w-full bg-background">
			<CardContent className="p-4">
				<div className="space-y-3">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Study Progress</h3>
						<span className="text-sm text-muted-foreground">
							Day {currentDay} of {totalDays}
						</span>
					</div>

					<div className="space-y-2">
						<Progress value={progressPercentage} className="h-2" />
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Start</span>
							<span>{Math.round(progressPercentage)}% Complete</span>
							<span>Finish</span>
						</div>
					</div>

					<div className="flex justify-center">
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{currentDay}
							</div>
							<div className="text-xs text-muted-foreground">
								Days Completed
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default StudyTimeline;
