import os
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import END
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

from .state import OverallState

MEMBERS = ["Scout", "Analyst", "Translator"]

SUPERVISOR_PROMPT = """
You are the Supervisor (Orchestrator). Your job is to read the conversation history and decide which worker to call next.
Your workers are: {members}.

USER INSTRUCTION FOR THIS SESSION:
"{initial_instruction}"

STRICT ROUTING RULES:
1. If the user instruction says "DAILY MODE":
   - The flow must be strictly: Scout -> Analyst -> Translator.
   - If the Translator has already finished its work, reply 'FINISH'.

2. If for some reason the last worker reports a critical error that prevents continuing, reply 'FINISH'.

CRITICAL INSTRUCTION: Reply ONLY with one of these words: Scout, Analyst, Translator or FINISH. Do not add periods, explanations, or quotes.
"""

def get_supervisor_llm():
    """Instantiates the LLM based on the .env file"""
    provider = os.environ.get("SUPERVISOR_PROVIDER", os.environ.get("LLM_PROVIDER", "ollama")).lower()
    
    if provider == "ollama":
        base_url = os.environ.get("OLLAMA_API_URL", "http://ollama:11434").replace("/api", "") + "/v1"
        return ChatOpenAI(
            base_url=base_url,
            api_key=os.environ.get("OLLAMA_API_KEY", "ollama"),
            model=os.environ.get("SUPERVISOR_MODEL", os.environ.get("OLLAMA_MODEL", "gemma3:12b-cloud"))
        )
    else:
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", 
            google_api_key=os.environ.get("GEMINI_API_KEY")
        )

def supervisor_node(state: OverallState) -> dict:
    """LangGraph Supervisor Node"""
    print("👔 [Supervisor] Reading history and deciding the next step...")
    
    raw_messages = state.get("messages", [])
    
    # We extract the first message (which is the prompt from your run_daily or run_weekly)
    initial_instruction = "Execute the entire normal flow."
    if raw_messages:
        initial_instruction = raw_messages[0].content
    
    # 1. We prepare the instructions injecting the execution mode
    system_prompt = SUPERVISOR_PROMPT.format(
        members=", ".join(MEMBERS),
        initial_instruction=initial_instruction
    )
    
    # 2. We build the textual history
    history_text = "ACTION HISTORY:\n"
    if not raw_messages:
        history_text += "No previous actions."
    else:
        for msg in raw_messages:
            history_text += f"[{msg.type.upper()}]: {msg.content}\n"
            
    # 3. We create a single safe message for the LLM
    final_messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=history_text)
    ]
    
    llm = get_supervisor_llm()
        
    try:
        response = llm.invoke(final_messages)
        # Thoroughly clean the response
        decision = response.content.strip().replace("'", "").replace('"', "").replace(".", "").split("\n")[0].strip()
    except Exception as e:
        print(f"❌ [Supervisor] Error calling the LLM: {e}")
        decision = "FINISH"

    valid_decisions = MEMBERS + ["FINISH"]
    
    # Safety check to match the exact word
    final_decision = "FINISH" # By default
    for valid in valid_decisions:
        if valid.upper() in decision.upper():
            final_decision = valid
            break
            
    if final_decision == "FINISH":
        print("👔 [Supervisor] Decision made -> Process finished (FINISH).")
        return {"next_agent": END}
    
    print(f"👔 [Supervisor] Decision made -> Delegating to: {final_decision}")
    return {"next_agent": final_decision}