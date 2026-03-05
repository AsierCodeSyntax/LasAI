import os
from langchain_core.tools import tool

@tool
def read_expert_skill_tool(skill_name: str) -> str:
    """
    Skill: Knowledge Reader.
    Use this tool to read your operations manual (SOP) BEFORE acting.
    Example of skill_name: 'MASTER_GUIDE'
    """
    print(f"   📚 [Scout Skill: Reader] Consulting the manual: {skill_name}.md")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    skill_path = os.path.join(base_dir, "skills", f"{skill_name}.md")
    
    if os.path.exists(skill_path):
        with open(skill_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        return f"❌ Error: The manual '{skill_name}.md' does not exist."