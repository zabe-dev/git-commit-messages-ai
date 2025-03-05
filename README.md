# Git Commit Messages AI

## Overview

Automatically generate conventional commit messages using AI, ensuring consistent and informative Git commit history.

## Prerequisites

- Node.js (v14 or later)
- Git
- OpenAI API access

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
```

2. Install dependencies:

```bash
npm install dotenv openai
```

3. Create `.env` file in project root:

```ini
GITHUB_ACCESS_TOKEN=""
OPENAI_BASE_MODEL="gpt-4o"
OPENAI_TEMPERATURE="0.5"
OPENAI_MAX_TOKENS="72"
OPENAI_TOP_P="1"
```

4. Create Git hook:
   Manually create a `prepare-commit-msg` file in `.git/hooks/` directory:

```bash
#!/bin/bash

PROJECT_ROOT="$(git rev-parse --show-toplevel)"

COMMIT_MESSAGE_SCRIPT="$PROJECT_ROOT/scripts/generate-commit-message.js"

if [ ! -f "$COMMIT_MESSAGE_SCRIPT" ]; then
    echo "Error: Commit message generation script not found at $COMMIT_MESSAGE_SCRIPT"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

node "$COMMIT_MESSAGE_SCRIPT" "$1"
```

5. Make the hook executable:

```bash
chmod +x .git/hooks/prepare-commit-msg
```

## Supported Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation updates
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI configuration changes
- `perf`: Performance improvements
- `revert`: Revert previous commit

## Example Commit Messages

- `feat(auth): add user login functionality`
- `fix(database): resolve connection timeout issue`
- `docs: update README with installation instructions`

## License

Personal Use Attribution License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software for personal use, with the following conditions:

1. Personal and non-commercial use is allowed.
2. If published or shared, original author attribution is required.

## Credits

Original concept and implementation by [zabe-dev](https://github.com/zabe-dev)
