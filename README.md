# Auto Generated Commit Messages with OpenAI

Are you like me who overthinks when writing your commit messages? Never stress over commit messages again — AI will do it for you! :)

1. npm install
2. create file `nano .git/hooks/prepare-commit-msg`
3. paste bash script:

```
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
4. make file executable `chmod +x .git/hooks/prepare-commit-msg`
5. Create your `.env` file

```
GITHUB_ACCESS_TOKEN="your_github_access_token"
OPENAI_BASE_MODEL="gpt-4o"
OPENAI_TEMPERATURE="0.5"
OPENAI_MAX_TOKENS="72"
OPENAI_TOP_P="1"
```

How to obtain `GITHUB_ACCESS_TOKEN`?

Watch this video: https://www.youtube.com/watch?v=YP8mV_2RDLc
