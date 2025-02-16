# Use the official Deno image
FROM denoland/deno:latest

# Set the working directory inside the container
WORKDIR /app

# Clone the GitHub repository
ARG GIT_REPO="https://github.com/joshuawjulian/discord-latex-bot.git"
RUN git clone $GIT_REPO /app

# Change working directory to the cloned repo (assuming bot.ts is at the root)
WORKDIR /app

# Cache dependencies
RUN deno cache bot.ts

# Set default command to run the bot
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--env-file", "bot.ts"]