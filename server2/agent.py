# agent.py
print(">>> agent.py imported (FAST MODE)")

from huggingface_hub import InferenceClient
import os


store: dict[str, list[dict]] = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = []
    return store[session_id]


class ChatAgent:
    def __init__(self, token: str, model_name: str):
        print(">>> Initializing InferenceClient")

        self.client = InferenceClient(
            model=model_name,
            token=token,
        )

        self.system_prompt = self._load_system_prompt()

        print(">>> InferenceClient ready")

    def _load_system_prompt(self) -> str:
        try:
            with open("prompt.txt", "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    
                    return content
        except FileNotFoundError:
            pass
        return "You are a helpful AI assistant."

    def chat(self, user_input: str, session_id: str = "default") -> str:
        try:
            print(">>> About to invoke model")

            history = get_session_history(session_id)

            # Build messages for HF chat completion
            messages = []

            if self.system_prompt:
                messages.append({
                    "role": "system",
                    "content": self.system_prompt
                })

            messages.extend(history)

            messages.append({
                "role": "user",
                "content": user_input
            })

            response = self.client.chat_completion(
                messages=messages,
                max_tokens=350,
                temperature=0.95,
                top_p=0.9,
            )

            reply = response.choices[0].message.content.strip()

            # Save to memory
            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": reply})

            return reply

        except Exception as e:
            print(f"[CHAT ERROR] {type(e).__name__}: {e}")
            return "Sorry, something went wrong on my end. Let's try again."

    def clear_memory(self, session_id: str = "default"):
        if session_id in store:
            store[session_id].clear()
