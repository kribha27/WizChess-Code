# WizChess

A beautiful chess interface powered by AI. Get strategic advice from Wiz, a wise mentor who guides you through chess positions without algebraic notation.

## Features

- **Interactive Chess Board**: Play chess with a clean, intuitive interface
- **AI-Powered Mentor**: Receive strategic guidance from Wiz powered by Google's Gemini API
- **Natural Language Advice**: Get coaching in plain English instead of cryptic notation
- **Real-time Validation**: Instant feedback on move legality

## Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **React Chessboard** - Chess board component
- **chess.js** - Chess logic and validation

### Backend
- **FastAPI** - High-performance Python web framework
- **Python 3.11+** - Backend runtime
- **Pydantic** - Data validation
- **httpx** - Async HTTP client
- **python-chess** - Chess engine and notation handling

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Google Gemini API key (optional, for AI features)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

The frontend will run on `http://localhost:5173` by default.

### Backend Setup

```bash
# Install dependencies
pip install -e .

# Or with development tools
pip install -e ".[dev]"

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`.

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash  # default

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

## API Endpoints

### Health Check
```
GET /healthz
```
Returns server status and configuration.

### Get Strategic Advice
```
POST /api/wiz
Content-Type: application/json

{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "lastMoves": ["e2e4", "c7c5"],
  "turn": "w"
}
```

Response:
```json
{
  "advice": "Your center looks solid, apprentice. Consider the harmony of your pieces..."
}
```

## Project Structure

```
WizChess-Code/
├── main.py              # FastAPI backend entry point
├── index.html           # HTML template
├── src/                 # React TypeScript source (generated in build)
├── package.json         # Frontend dependencies
├── pyproject.toml       # Backend dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md            # This file
```

## Development

### Frontend Development
- Uses Vite for fast HMR (Hot Module Replacement)
- TypeScript with strict mode enabled
- ESLint for code quality

### Backend Development
- FastAPI with automatic API documentation at `/docs`
- CORS enabled for frontend integration
- Async request handling for better performance

## Deployment

### Docker (Recommended)

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend (build stage)
FROM node:18 as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Frontend (serve)
FROM node:18-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Manual Deployment
1. Build the frontend: `npm run build`
2. Serve the `dist/` folder with a web server (Nginx, Vercel, etc.)
3. Deploy the backend using `uvicorn` or a ASGI server (Gunicorn, etc.)
4. Set `ALLOWED_ORIGINS` environment variable to include your frontend URL

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## License

This project is open source. See LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Chess logic via [python-chess](https://python-chess.readthedocs.io/)
- AI insights from [Google Gemini](https://deepmind.google/technologies/gemini/)
