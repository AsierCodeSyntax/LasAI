from langchain_core.messages import HumanMessage
from agents.main_graph import main_graph

def main():
    print("🌅 [Daily] Iniciando rutina diaria...")
    prompt = "MODO DIARIO. Ejecuta el ciclo: 1. Scout -> 2. Analyst -> 3. Translator. Una vez acabe el Traductor, finaliza el proceso inmediatamente."
    initial_state = {"messages": [HumanMessage(content=prompt)], "next_agent": "", "errors": []}
    
    for event in main_graph.stream(initial_state, {"recursion_limit": 150}):
        pass 
    print("✅ Rutina diaria completada.")

if __name__ == "__main__":
    main()