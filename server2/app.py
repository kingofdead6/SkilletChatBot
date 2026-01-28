# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import ChatAgent
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Config
TEXT_MODEL = os.getenv("TEXT_MODEL")
HF_API_TOKEN = os.getenv("HF_API_TOKEN")  # recommended: store token in .env

# We'll store one agent per session (simple in-memory for now)
# For production, use Redis or similar
sessions = {}

def get_agent(session_id: str):
    if session_id not in sessions:
        if not HF_API_TOKEN:
            raise ValueError("HF_API_TOKEN not set")
        sessions[session_id] = ChatAgent(token=HF_API_TOKEN, model_name=TEXT_MODEL)
    return sessions[session_id]

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")   # optional – can be random or user-based

    if not message:
        return jsonify({"error": "No message provided"}), 400

    try:
        agent = get_agent(session_id)   # your existing get_agent function
        reply = agent.chat(message, session_id=session_id)
        
        return jsonify({
            "response": reply,
            "model": TEXT_MODEL
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Optional: clear conversation memory
@app.route("/clear", methods=["POST"])
def clear():
    data = request.get_json() or {}
    session_id = data.get("session_id", "default")
    if session_id in sessions:
        sessions[session_id].clear_memory()
    return jsonify({"status": "cleared"})

if __name__ == "__main__":
    print("LangChain Chatbot with Memory Starting... 🚀")
    print(f"Model: {TEXT_MODEL}")
    app.run(host="0.0.0.0", port=5000, debug=False)