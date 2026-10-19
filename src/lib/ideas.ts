import data from "../../content/story-ideas.json";

export type StoryIdea = {
  id: string;
  title: string;
  angle: string;
  category: string;
  listing: string;
  season: "spring" | "summer" | "fall";
  status: "written" | "idea";
  article: string;
};
export const storyIdeas = data.ideas as StoryIdea[];
