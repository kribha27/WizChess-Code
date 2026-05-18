
# WizChess 🧩♟️  
A beautiful chess interface based on magic,powered by AI

## 🚀 Overview
WizChess is a modern chess application that combines a sleek frontend with a powerful FastAPI backend. It’s designed to provide an intuitive interface for players while leveraging AI to analyze moves, suggest strategies, and enhance gameplay.

## ✨ Features
- **AI‑powered analysis**: Get real‑time move suggestions and insights.  
- **FastAPI backend**: Lightweight, secure, and scalable server powering the AI.  
- **Vite + React frontend**: Fast, responsive, and developer‑friendly UI.  
- **Cross‑platform**: Works seamlessly in browsers and can be extended to desktop/mobile.  
- **Secure API key management**: Environment variables ensure safe integration with AI models.  

## ⚙️ Installation

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment
- **Frontend** → Deploy on Netlify or Vercel.  
- **Backend** → Deploy on Render, Railway, or Fly.io.  
- Use `.env` files for API keys and secrets.  

## 🛡️ Best Practices
- Add `.gitignore` to exclude `node_modules/`, `__pycache__/`, `.env`, and build artifacts.  
- Never commit API keys — store them in environment variables.  
- Keep dependencies updated in `requirements.txt` and `package-lock.json`.  

## 🤝 Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to improve.
