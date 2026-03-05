from langgraph.graph import StateGraph, START, END
from .state import OverallState
from .supervisor import supervisor_node

from .scout.agent import scout_node
from .analyst.agent import analyst_node
from .translator.agent import translator_node

def create_main_graph():
    builder = StateGraph(OverallState)
    
    # 1. Nodes
    builder.add_node("Supervisor", supervisor_node)
    builder.add_node("Scout", scout_node)
    builder.add_node("Analyst", analyst_node)
    builder.add_node("Translator", translator_node)
    
    # 2. Entry point
    builder.add_edge(START, "Supervisor")
    
    # 3. Supervisor decisions (Routing)
    builder.add_conditional_edges(
        "Supervisor",
        lambda state: state.get("next_agent", "FINISH"),
        {
            "Scout": "Scout",
            "Analyst": "Analyst",
            "Translator": "Translator",
            "FINISH": END,
            END: END
        }
    )
    
    # 4. All agents return control to the Supervisor
    builder.add_edge("Scout", "Supervisor")
    builder.add_edge("Analyst", "Supervisor")
    builder.add_edge("Translator", "Supervisor")
    
    return builder.compile()

main_graph = create_main_graph()