# agent.py
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
import os


store: dict[str, BaseChatMessageHistory] = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

class ChatAgent:
    def __init__(self, token: str, model_name: str):
        self.token = token
        self.model_name = model_name

        system_prompt = self._load_system_prompt()

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])

        # Use HuggingFaceEndpoint as base + wrap with ChatHuggingFace
        endpoint = HuggingFaceEndpoint(
            repo_id=model_name,
            huggingfacehub_api_token=token,
            # task="conversational",          # optional now – ChatHuggingFace handles it
            temperature=0.95,
            top_p=0.9,
            max_new_tokens=350,
            repetition_penalty=1.1,
        )

        self.llm = ChatHuggingFace(llm=endpoint)

        chain = prompt | self.llm

        self.chain_with_history = RunnableWithMessageHistory(
            chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="history",
        )

    def _load_system_prompt(self) -> str:
        try:
            with open("prompt.txt", "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    return content
        except FileNotFoundError:
            pass


    def chat(self, user_input: str, session_id: str = "default") -> str:
        try:
            config = {"configurable": {"session_id": session_id}}
            response = self.chain_with_history.invoke(
                {"input": user_input},
                config=config
            )
            # ChatHuggingFace returns AIMessage → extract content
            if hasattr(response, 'content'):
                return response.content.strip()
            return str(response).strip()
        except Exception as e:
            print(f"[CHAIN ERROR] {type(e).__name__}: {e}")
            return "Sorry, something went wrong on my end. Let's try again."

    def clear_memory(self, session_id: str = "default"):
        if session_id in store:
            store[session_id].clear()