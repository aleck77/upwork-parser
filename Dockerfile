FROM mcr.microsoft.com/playwright:v1.53.2-jammy
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "universal-parser.js", "github", "js_playwright"] 