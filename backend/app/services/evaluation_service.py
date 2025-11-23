from typing import Dict, List
from app.services.llm_service import llm_service

try:
    import numpy as np
except Exception:
    # Minimal fallback for mean
    class _NPFallback:
        @staticmethod
        def mean(arr):
            arr = [a for a in arr if a is not None]
            return float(sum(arr)) / len(arr) if arr else 0.0

    np = _NPFallback()

class EvaluationService:
    def __init__(self):
        self.scoring_criteria = {
            "communication": ["clarity", "articulation", "structure"],
            "technical": ["accuracy", "depth", "examples"],
            "problem_solving": ["approach", "creativity", "logic"],
            "confidence": ["assertiveness", "composure", "engagement"]
        }
    
    def evaluate_interview(
        self,
        conversation_history: List[Dict],
        evaluation_notes: List[Dict],
        role: str,
        user_profile: Dict
    ) -> Dict:
        """Generate comprehensive evaluation"""
        
        # Generate overall evaluation
        overall_eval = self._generate_overall_evaluation(
            conversation_history,
            evaluation_notes,
            role
        )
        
        # Calculate scores
        scores = self._calculate_scores(evaluation_notes, overall_eval)
        
        # Identify strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(overall_eval)
        
        # Generate improvement areas
        improvement_areas = self._generate_improvement_areas(
            weaknesses,
            role,
            user_profile
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            scores,
            improvement_areas,
            role
        )
        
        return {
            "overall_score": scores["overall"],
            "communication_score": scores["communication"],
            "technical_score": scores["technical"],
            "problem_solving_score": scores["problem_solving"],
            "confidence_score": scores["confidence"],
            "strengths": strengths,
            "weaknesses": weaknesses,
            "improvement_areas": improvement_areas,
            "recommendations": recommendations,
            "question_feedback": evaluation_notes
        }
    
    def _generate_overall_evaluation(
        self,
        conversation_history: List[Dict],
        evaluation_notes: List[Dict],
        role: str
    ) -> str:
        """Generate comprehensive evaluation using LLM"""
        
        eval_prompt = f"""
Provide a comprehensive evaluation of this interview for a {role} position.

Interview Transcript:
{self._format_conversation(conversation_history)}

Question-by-question evaluations:
{self._format_evaluations(evaluation_notes)}

Provide a detailed evaluation covering:
1. Overall performance
2. Communication skills
3. Technical knowledge
4. Problem-solving abilities
5. Confidence and presence
6. Key strengths
7. Areas for improvement

Evaluation:
"""
        
        evaluation = llm_service.generate(
            prompt=eval_prompt,
            system_prompt="You are an expert interview evaluator providing detailed, constructive feedback.",
            max_new_tokens=800,
            temperature=0.7
        )
        
        return evaluation
    
    def _calculate_scores(
        self,
        evaluation_notes: List[Dict],
        overall_eval: str
    ) -> Dict[str, float]:
        """Calculate numerical scores"""
        
        # Use LLM to extract scores
        scoring_prompt = f"""
Based on this evaluation, provide numerical scores (0-100) for:
1. Communication
2. Technical Knowledge
3. Problem Solving
4. Confidence

Evaluation:
{overall_eval}

Provide scores in this exact format:
Communication: [score]
Technical: [score]
Problem Solving: [score]
Confidence: [score]
"""
        
        scores_text = llm_service.generate(
            prompt=scoring_prompt,
            max_new_tokens=100,
            temperature=0.3
        )
        
        # Parse scores
        scores = self._parse_scores(scores_text)
        
        # Calculate overall score
        scores["overall"] = np.mean([
            scores.get("communication", 70),
            scores.get("technical", 70),
            scores.get("problem_solving", 70),
            scores.get("confidence", 70)
        ])
        
        return scores
    
    def _parse_scores(self, scores_text: str) -> Dict[str, float]:
        """Parse scores from text"""
        scores = {}
        
        import re
        patterns = {
            "communication": r"Communication:\s*(\d+)",
            "technical": r"Technical:\s*(\d+)",
            "problem_solving": r"Problem Solving:\s*(\d+)",
            "confidence": r"Confidence:\s*(\d+)"
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, scores_text, re.IGNORECASE)
            if match:
                scores[key] = float(match.group(1))
            else:
                scores[key] = 70.0  # Default score
        
        return scores
    
    def _identify_strengths_weaknesses(
        self,
        evaluation: str
    ) -> tuple[List[str], List[str]]:
        """Extract strengths and weaknesses"""
        
        extraction_prompt = f"""
From this evaluation, extract:
1. Top 3-5 strengths
2. Top 3-5 weaknesses/areas for improvement

Evaluation:
{evaluation}

Format:
STRENGTHS:
- [strength 1]
- [strength 2]
...

WEAKNESSES:
- [weakness 1]
- [weakness 2]
...
"""
        
        result = llm_service.generate(
            prompt=extraction_prompt,
            max_new_tokens=300,
            temperature=0.5
        )
        
        strengths = []
        weaknesses = []
        
        # Parse result
        if "STRENGTHS:" in result and "WEAKNESSES:" in result:
            parts = result.split("WEAKNESSES:")
            strengths_text = parts[0].replace("STRENGTHS:", "").strip()
            weaknesses_text = parts[1].strip()
            
            strengths = [s.strip("- ").strip() for s in strengths_text.split("\n") if s.strip()]
            weaknesses = [w.strip("- ").strip() for w in weaknesses_text.split("\n") if w.strip()]
        
        return strengths[:5], weaknesses[:5]
    
    def _generate_improvement_areas(
        self,
        weaknesses: List[str],
        role: str,
        user_profile: Dict
    ) -> List[Dict]:
        """Generate specific improvement areas with action items"""
        
        improvement_areas = []
        
        for weakness in weaknesses:
            action_prompt = f"""
For this weakness in a {role} interview:
"{weakness}"

Provide:
1. Specific action items (2-3)
2. Resources or practice methods
3. Timeline for improvement

Keep it practical and actionable:
"""
            
            actions = llm_service.generate(
                prompt=action_prompt,
                max_new_tokens=200,
                temperature=0.7
            )
            
            improvement_areas.append({
                "area": weakness,
                "action_plan": actions,
                "priority": "high" if "technical" in weakness.lower() else "medium"
            })
        
        return improvement_areas
    
    def _generate_recommendations(
        self,
        scores: Dict[str, float],
        improvement_areas: List[Dict],
        role: str
    ) -> str:
        """Generate personalized recommendations"""
        
        rec_prompt = f"""
Based on these interview scores for a {role} position:
- Overall: {scores['overall']:.1f}
- Communication: {scores['communication']:.1f}
- Technical: {scores['technical']:.1f}
- Problem Solving: {scores['problem_solving']:.1f}
- Confidence: {scores['confidence']:.1f}

And these improvement areas:
{self._format_improvement_areas(improvement_areas)}

Provide:
1. Next steps for interview preparation
2. Recommended resources or courses
3. Practice strategies
4. Timeline for improvement

Recommendations:
"""
        
        recommendations = llm_service.generate(
            prompt=rec_prompt,
            max_new_tokens=500,
            temperature=0.7
        )
        
        return recommendations
    
    def _format_conversation(self, history: List[Dict]) -> str:
        """Format conversation history"""
        formatted = []
        for msg in history:
            role = msg["role"].capitalize()
            content = msg["content"]
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)
    
    def _format_evaluations(self, notes: List[Dict]) -> str:
        """Format evaluation notes"""
        formatted = []
        for i, note in enumerate(notes, 1):
            formatted.append(f"Q{i}: {note['question']}")
            formatted.append(f"A{i}: {note['response']}")
            formatted.append(f"Evaluation: {note['evaluation']}\n")
        return "\n".join(formatted)
    
    def _format_improvement_areas(self, areas: List[Dict]) -> str:
        """Format improvement areas"""
        return "\n".join([f"- {area['area']}" for area in areas])

evaluation_service = EvaluationService()