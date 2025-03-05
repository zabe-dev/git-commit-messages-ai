require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const { OpenAI } = require("openai");

// validate github access token
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
if (!GITHUB_ACCESS_TOKEN) {
	console.error("Error: GitHub access token is missing.");
	process.exit(1);
}

const COMMIT_TYPES = {
	feat: "New feature",
	fix: "Bug fix",
	docs: "Documentation updates",
	style: "Code style changes",
	refactor: "Code refactoring",
	test: "Test updates",
	chore: "Maintenance tasks",
	build: "Build system changes",
	ci: "CI configuration changes",
	perf: "Performance improvements",
	revert: "Revert previous commit",
};

// make sure commit message follows rules set
const isValidCommitMessage = (message) => {
	const cleanedMessage = message.trim().replace(/^`+|`+$/g, "");
	const conventionalCommitRegex =
		/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\([a-z0-9-]+\))?:\s*.+$/;

	if (cleanedMessage.length > 72) {
		return false;
	}

	if (!conventionalCommitRegex.test(cleanedMessage)) {
		return false;
	}

	return true;
};

const getStagedDiff = () => {
	try {
		const diff = execSync("git diff --staged", { encoding: "utf-8" }).trim();
		if (!diff) {
			console.log("No staged changes detected.");
			process.exit(0);
		}
		return diff;
	} catch (error) {
		console.error("Error fetching Git diff:", error.message);
		process.exit(1);
	}
};

const generateUserPrompt = (diff) => `
  Generate a concise conventional commit message that:
    • Uses a standard prefix from: ${Object.keys(COMMIT_TYPES).join(", ")}
    • Optional scope in parentheses is allowed
    • Describes the core change precisely
    • Must be 72 characters or less

  Commit Type Guidelines:
  ${Object.entries(COMMIT_TYPES)
		.map(([type, description]) => `${type}: ${description}`)
		.join("\n")}

  Staged Changes Context:
  ${diff.substring(0, 500)}  
`;

const generateCommitMessage = async (diff, attempts = 3) => {
	if (attempts <= 0) {
		console.warn(
			"Failed to generate a valid commit message after multiple attempts."
		);
		return null;
	}

	try {
		const openaiClient = new OpenAI({
			apiKey: GITHUB_ACCESS_TOKEN,
			baseURL: "https://models.inference.ai.azure.com",
		});

		const response = await openaiClient.chat.completions.create({
			model: process.env.OPENAI_BASE_MODEL,
			messages: [
				{
					role: "system",
					content:
						"Generate precise, concise Git commit messages following conventional commit standards. Focus on brevity and clarity. Ensure the message is 72 characters or less.",
				},
				{
					role: "user",
					content: generateUserPrompt(diff),
				},
				{
					role: "user",
					content:
						"Reminder: The commit message MUST be 72 characters or less. Be extremely concise.",
				},
			],
			temperature: Number(process.env.OPENAI_TEMPERATURE),
			max_tokens: Number(process.env.OPENAI_MAX_TOKENS),
			top_p: Number(process.env.OPENAI_TOP_P),
		});

		const messageContent = response.choices?.[0]?.message?.content;
		if (!messageContent) {
			throw new Error("No content received from the service");
		}

		// clean and validate the commit message
		const cleanedMessage = messageContent
			.trim()
			.replace(/^`+/, "") // Remove leading backticks
			.replace(/`+$/, "") // Remove trailing backticks
			.replace(/^["']/, "") // Remove leading quotes
			.replace(/["']$/, "") // Remove trailing quotes
			.replace(/\n/g, " ") // Replace newlines with spaces
			.replace(/\*$/, "") // Remove trailing asterisks
			.trim();

		// if message is invalid, recursively try again
		if (!isValidCommitMessage(cleanedMessage)) {
			console.warn(
				`Invalid message (${cleanedMessage.length} chars): Regenerating...`
			);
			return generateCommitMessage(diff, attempts - 1);
		}

		return cleanedMessage;
	} catch (error) {
		console.error("Error generating commit message:", error.message);

		// if there's an error, try again with fewer attempts
		if (attempts > 0) {
			return generateCommitMessage(diff, attempts - 1);
		}

		return null;
	}
};

const main = async () => {
	if (process.argv.length < 3) {
		console.error("Error: Commit message file path not provided.");
		console.error("This script should be run as a Git hook.");
		console.error(
			"Typical arguments: [hook-name] [commit-msg-file] [commit-source]"
		);
		process.exit(1);
	}

	const commitMsgFile = process.argv[2];

	try {
		const diff = getStagedDiff();
		const commitMessage = await generateCommitMessage(diff);

		if (commitMessage) {
			// if ai successfully generated a commit message, write it
			fs.writeFileSync(commitMsgFile, commitMessage, "utf-8");
			console.log("Commit message generated successfully:", commitMessage);
		} else {
			// if ai failed, read the existing commit message (if any)
			const existingMessage = fs.existsSync(commitMsgFile)
				? fs.readFileSync(commitMsgFile, "utf-8").trim()
				: "";

			if (existingMessage) {
				console.warn(
					"Generating commit message failed. Using existing message."
				);
			} else {
				console.warn(
					"Generating commit message failed. Please write the commit message manually."
				);
			}
			process.exit(0);
		}
	} catch (error) {
		console.error("Failed to generate commit message:", error.message);
		process.exit(0);
	}
};

main();
