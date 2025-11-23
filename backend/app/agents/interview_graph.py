try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except Exception:
    StateGraph = None
    END = None
    LANGGRAPH_AVAILABLE = False

from typing import TypedDict, List, Dict, Annotated
import operator
from app.services.llm_service import llm_service


class InterviewState(TypedDict):
    role: str
    difficulty: str
    user_profile: Dict
    conversation_history: Annotated[List[Dict], operator.add]
    current_question: str
    question_count: int
    max_questions: int
    evaluation_notes: Annotated[List[str], operator.add]
    thinking_process: str
    user_response: str
    should_end: bool

class InterviewGraph:
    def __init__(self):
        # If langgraph is available, build the full workflow; otherwise provide a lightweight fallback
        if LANGGRAPH_AVAILABLE and StateGraph is not None:
            self.graph = self.build_graph()
        else:
            self.graph = self.MockGraph(self)

    def build_graph(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(InterviewState)

        # Add nodes
        workflow.add_node("initialize", self.initialize_interview)
        workflow.add_node("generate_question", self.generate_question)
        workflow.add_node("analyze_response", self.analyze_response)
        workflow.add_node("provide_feedback", self.provide_feedback)
        workflow.add_node("decide_next", self.decide_next_step)

        # Add edges
        workflow.set_entry_point("initialize")
        workflow.add_edge("initialize", "generate_question")
        workflow.add_edge("generate_question", "analyze_response")
        workflow.add_edge("analyze_response", "provide_feedback")
        workflow.add_edge("provide_feedback", "decide_next")

        # Conditional edge
        workflow.add_conditional_edges(
            "decide_next",
            self.should_continue,
            {
                "continue": "generate_question",
                "end": END
            }
        )

        return workflow.compile()

    class MockGraph:
        """A very small fallback graph that mimics `graph.invoke(state)` used by the app."""

        def __init__(self, parent):
            self.parent = parent

        def invoke(self, state):
            # Ensure expected keys exist
            state.setdefault("conversation_history", state.get("conversation_history") or [])
            state.setdefault("question_count", state.get("question_count", 0))
            state.setdefault("max_questions", state.get("max_questions", 10))
            state.setdefault("evaluation_notes", state.get("evaluation_notes") or [])

            # If no current question, initialize
            if not state.get("current_question"):
                state = self.parent.initialize_interview(state)

            # If user response exists, analyze and append evaluation
            if state.get("user_response"):
                state = self.parent.analyze_response(state)
                state = self.parent.provide_feedback(state)

            # If question_count not exceeded, generate a new question
            if state.get("question_count", 0) < state.get("max_questions", 10):
                state = self.parent.generate_question(state)
            else:
                state["should_end"] = True

            return state
    
    def initialize_interview(self, state: InterviewState) -> InterviewState:
        """Initialize the interview session"""
        state["question_count"] = 0
        state["max_questions"] = 10  # Default
        state["should_end"] = False
        state["conversation_history"] = []
        state["evaluation_notes"] = []
        
        state["thinking_process"] = f"Initializing interview for {state['role']} position..."
        
        return state
    
    def generate_question(self, state: InterviewState) -> InterviewState:
        """Generate next interview question"""
        state["thinking_process"] = "Analyzing candidate profile and generating next question..."
        
        # Build context
        context = f"""
You are an experienced interviewer conducting a {state['difficulty']} level interview for a {state['role']} position.

Candidate Profile:
- Skills: {', '.join(state['user_profile'].get('skills', []))}
- Experience: {state['user_profile'].get('experience_years', 0)} years
- Target Roles: {', '.join(state['user_profile'].get('target_roles', []))}

Previous conversation:
{self._format_conversation(state['conversation_history'])}

Generate the next interview question. The question should:
1. Be relevant to the role and candidate's background
2. Match the {state['difficulty']} difficulty level
3. Build upon previous responses if applicable
4. Test different aspects (technical, behavioral, problem-solving)

Question {state['question_count'] + 1}:
"""
        
        question = llm_service.generate(
            prompt=context,
            system_prompt="You are an expert interviewer. Generate one clear, focused interview question.",
            max_new_tokens=200,
            temperature=0.8
        )
        
        state["current_question"] = question
        state["question_count"] += 1
        
        return state
    
    def analyze_response(self, state: InterviewState) -> InterviewState:
        """Analyze user's response"""
        if not state.get("user_response"):
            return state
        
        state["thinking_process"] = "Analyzing response quality and depth..."
        
        analysis_prompt = f"""
Analyze this interview response:

Question: {state['current_question']}
Response: {state['user_response']}

Evaluate the response on:
1. Relevance and directness
2. Technical accuracy (if applicable)
3. Communication clarity
4. Depth of knowledge
5. Problem-solving approach

Provide brief evaluation notes (2-3 sentences):
"""
        
        evaluation = llm_service.generate(
            prompt=analysis_prompt,
            system_prompt="You are an expert interviewer evaluating candidate responses.",
            max_new_tokens=150
        )
        
        state["evaluation_notes"].append({
            "question": state["current_question"],
            "response": state["user_response"],
            "evaluation": evaluation
        })
        
        return state
    
    def provide_feedback(self, state: InterviewState) -> InterviewState:
        """Provide immediate feedback or follow-up"""
        state["thinking_process"] = "Formulating follow-up or feedback..."
        
        feedback_prompt = f"""
Based on the candidate's response, provide a brief acknowledgment and decide if a follow-up question is needed.

Question: {state['current_question']}
Response: {state['user_response']}

Provide either:
- A brief acknowledgment and move on, OR
- A follow-up question to dig deeper

Keep it conversational and natural:
"""
        
        feedback = llm_service.generate(
            prompt=feedback_prompt,
            max_new_tokens=100,
            temperature=0.7
        )
        
        state["conversation_history"].append({
            "role": "interviewer",
            "content": feedback
        })
        
        return state
    
    def decide_next_step(self, state: InterviewState) -> InterviewState:
        """Decide whether to continue or end interview"""
        if state["question_count"] >= state["max_questions"]:
            state["should_end"] = True
        
        return state
    
    def should_continue(self, state: InterviewState) -> str:
        """Determine if interview should continue"""
        return "end" if state["should_end"] else "continue"
    
    def _format_conversation(self, history: List[Dict]) -> str:
        """Format conversation history"""
        if not history:
            return "No previous conversation"
        
        formatted = []
        for msg in history[-5:]:  # Last 5 messages
            role = msg["role"].capitalize()
            content = msg["content"]
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)

interview_graph = InterviewGraph()