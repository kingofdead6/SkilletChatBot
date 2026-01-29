# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import ChatAgent
import os

app = Flask(__name__)
CORS(app)

# Fallback token from .env (used only if user doesn't provide one)
FALLBACK_HF_TOKEN = os.getenv("HF_API_TOKEN")
TEXT_MODEL = os.getenv("TEXT_MODEL", "meta-llama/Llama-3.2-3B-Instruct")  # example default

# We'll create agent per request now (to support per-user tokens)
def get_agent(hf_token=None):
    token = hf_token or FALLBACK_HF_TOKEN
    if not token:
        raise ValueError("No Hugging Face API token provided and no fallback token set")
    return ChatAgent(token=token, model_name=TEXT_MODEL)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")
    hf_token = data.get("hf_token")  # user-provided token

    if not message:
        return jsonify({"error": "No message provided"}), 400

    try:
        agent = get_agent(hf_token)  # uses user token or fallback
        reply = agent.chat(message, session_id=session_id)

        return jsonify({
            "response": reply,
            "model": TEXT_MODEL
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Optional clear route (unchanged)
@app.route("/clear", methods=["POST"])
def clear():
    # ... (you may want to adapt if agents are per-request now)
    return jsonify({"status": "cleared"})

if __name__ == "__main__":
    print("LangChain Chatbot with Per-User Tokens Starting... 🚀")
    print(f"Default model: {TEXT_MODEL}")
    app.run(host="0.0.0.0", port=5000, debug=False)