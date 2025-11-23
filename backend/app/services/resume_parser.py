import re
from typing import Dict, List

try:
    import PyPDF2
    import docx
    import spacy
    import pdfplumber
    HAS_PARSING_LIBS = True
except Exception:
    HAS_PARSING_LIBS = False


class ResumeParser:
    def __init__(self):
        if HAS_PARSING_LIBS:
            try:
                # Load spaCy model for NER
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                try:
                    import os
                    os.system("python -m spacy download en_core_web_sm")
                    self.nlp = spacy.load("en_core_web_sm")
                except Exception:
                    self.nlp = None
        else:
            self.nlp = None

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF (best-effort)"""
        if HAS_PARSING_LIBS:
            try:
                text = ""
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        text += page_text + "\n"
                return text
            except Exception:
                return ""
        return ""

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX (best-effort)"""
        if HAS_PARSING_LIBS:
            try:
                doc = docx.Document(file_path)
                return "\n".join([para.text for para in doc.paragraphs])
            except Exception:
                return ""
        return ""

    def extract_email(self, text: str) -> str:
        """Extract email from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else ""

    def extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        phone_pattern = r'\+?\d[\d\-\s()]{7,}\d'
        phones = re.findall(phone_pattern, text)
        return phones[0] if phones else ""

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume using a simple keyword approach"""
        skills_db = [
            'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift',
            'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring',
            'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes',
            'machine learning', 'deep learning', 'nlp', 'computer vision',
            'git', 'agile', 'scrum', 'jira',
            'html', 'css', 'typescript', 'rest api', 'graphql'
        ]

        text_lower = (text or "").lower()
        found_skills = []

        for skill in skills_db:
            if skill in text_lower:
                found_skills.append(skill.title())

        return list(set(found_skills))

    def extract_experience(self, text: str) -> int:
        """Extract years of experience"""
        experience_pattern = r'(\d+)\+?\s*(?:years?|yrs?)'
        matches = re.findall(experience_pattern, (text or "").lower())

        if matches:
            return max([int(match) for match in matches])
        return 0

    def parse_resume(self, file_path: str) -> Dict:
        """Parse resume and extract all information (best-effort)"""
        text = ""
        if file_path.endswith('.pdf'):
            text = self.extract_text_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            text = self.extract_text_from_docx(file_path)
        else:
            # Try to read as plain text
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            except Exception:
                text = ""

        parsed_data = {
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "skills": self.extract_skills(text),
            "experience_years": self.extract_experience(text),
            "raw_text": text
        }

        return parsed_data


resume_parser = ResumeParser()