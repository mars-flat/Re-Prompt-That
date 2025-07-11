# Re-Prompt-That
Re-Prompt That (RPT) is a fast-paced, brain-teaser game that helps users improve their AI prompting skills through real-time challenges, instant feedback, and a competitive social learning environment. RPT provides users with ChatGPT's output from an unknown prompt, and users are then challenged to guess what the prompt is. The closer they are, the more points they get. Through multiple rounds of games, users can better understand the tone and format that ChatGPT uses, helping them prompt better.

Hack404 (2025) submission. 

## Inspiration
As AI tools like ChatGPT become more powerful, the ability to prompt effectively is becoming essential. Entire job roles like prompt engineering have emerged. However, most people struggle with it — they don’t know what to ask, how to ask it, or why some prompts work better than others.

We realized prompting is like a language. There are courses and websites dedicated to learning and understanding it, but there is no fun, interactive way to practice it. That’s when the idea hit us: what if prompting was a game?

## How we built it
We started by sketching out core gameplay ideas: 60-second challenges, constraints like banned words or mystery goals, real-time scoring and leaderboards, and output-based guessing (reverse-prompting). 

## Challenges we ran into
One of our biggest challenges was working with unfamiliar frameworks and tools. We had to get up to speed quickly with technologies like WebSockets, Express, and NGINX. Deploying the project to Amazon EC2 also presented its own hurdles.

## Accomplishments that we're proud of
Integrating all the moving parts was a major challenge — from building a WebSocket server for the first time, to connecting it with the frontend, to deploying everything in a way that was easily accessible to users.

## What we learned
We underestimated the capabilities of AI. Throughout the project, we were consistently surprised by how adaptive large language models can be — especially when given well-structured prompts. This reinforced how important it is to understand how to guide AI behavior effectively.

## What's next for Re-Prompt That
We're expanding beyond the reverse-prompt challenge to include new formats. For instance, one mode could involve trying to figure out the original prompt based on the output generated by ChatGPT, without using the given restricted words. Another option could be competing to generate the most efficient code that passes the most hidden test cases.

# Installation

## Backend

1. Create a `.env` in `backend/` and place an `OPENAI_API_KEY`.
2. run `npm install`
3. run `npm start`. The port is `4000`.

## Frontend

1. Create a `.env` in `frontend/` and place an `NEXT_PUBLIC_BACKEND_URL`, which is the URL used to host the backend.
2. run `npm install`
3. run `npm start`. The port is `3000`.
