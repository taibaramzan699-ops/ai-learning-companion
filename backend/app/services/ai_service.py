"""AI service for note processing using OpenAI"""
import html
import re

import markdown as markdown_lib
from app.core.config import settings
import os
from typing import Optional

import openai

from app.models.notes_enhanced import (
    AIMetadata,
    Flashcard,
    QuizQuestion,
)

_STYLE_INSTRUCTION = (
    " Do not use markdown symbols (no asterisks, no hash headings). Do not add filler "
    "phrases like 'Sure!' or 'Let's break down' or 'Here is' — start directly with the "
    "content. Be direct, precise, and professional."
)


def _strip_ai_filler(text: str) -> str:
    """Remove common conversational openers AI models add before the real content."""
    patterns = [
        r"^(sure!?|okay!?|alright!?|certainly!?)[,.\s]*",
        r"^(let'?s (break down|dive in|explore|go through)[^\n.]*[.:]\s*)",
        r"^(here'?s|here is)[^\n.]*[.:]\s*",
        r"^(i'?d be happy to help[^\n.]*[.:]\s*)",
        r'^\S*\.?(pdf|docx?|pptx?|txt|xlsx)"?\s*:\s*',
    ]
    result = text.strip()
    for pattern in patterns:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE)
    return result.strip()


def _inline_markdown_to_html(text: str) -> str:
    """Convert simple inline markdown (code spans, bold) into safe HTML for short list items."""
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    return escaped


class AIService:
    """Service for AI-powered note features"""

    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o-mini"  # Cost-effective model
        self.max_tokens = 2000

    async def summarize_note(self, content: str, title: str) -> Optional[str]:
        """Generate a concise summary of note content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that creates clear, concise summaries. "
                        "Return only the summary, no additional text." + _STYLE_INSTRUCTION,
                    },
                    {
                        "role": "user",
                        "content": f"Summarize this note in 2-3 sentences:\n\nTitle: {title}\n\nContent: {content}",
                    },
                ],
                max_tokens=300,
                temperature=0.5,
            )
            return _strip_ai_filler(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"[v0] Error summarizing note: {e}")
            return None

    async def generate_title(self, content: str) -> str:
        """Generate a short, professional title for a piece of content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a short, clear, professional title (max 8 words) for the given content. "
                        "Return ONLY the title text, no quotes, no extra text.",
                    },
                    {"role": "user", "content": content[:3000]},
                ],
                max_tokens=30,
                temperature=0.6,
            )
            title = response.choices[0].message.content.strip().strip('"')
            return title or "Untitled Note"
        except Exception as e:
            print(f"[v0] Error generating title: {e}")
            return "Untitled Note"

    async def generate_tags(self, content: str, max_tags: int = 5) -> list[str]:
        """Generate relevant tags for a piece of content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f'Generate up to {max_tags} short, relevant topic tags (1-2 words each) for the content. Return ONLY a JSON array of strings, e.g. ["CSS","Frontend"]. No extra text.',
                    },
                    {"role": "user", "content": content[:3000]},
                ],
                max_tokens=100,
                temperature=0.5,
            )
            import json, re as re_mod

            text = response.choices[0].message.content.strip()
            try:
                tags = json.loads(text)
            except json.JSONDecodeError:
                match = re_mod.search(r"\[.*\]", text, re_mod.DOTALL)
                tags = json.loads(match.group()) if match else []
            return [str(t).strip() for t in tags[:max_tags] if str(t).strip()]
        except Exception as e:
            print(f"[v0] Error generating tags: {e}")
            return []

    async def generate_category(self, content: str) -> str:
        """Generate a single high-level subject category for the content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Classify the content into ONE short subject category (e.g. 'Web Development', 'Mathematics', 'Biology', 'Machine Learning'). Return ONLY the category name, no extra text.",
                    },
                    {"role": "user", "content": content[:3000]},
                ],
                max_tokens=15,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip().strip('"') or "General"
        except Exception as e:
            print(f"[v0] Error generating category: {e}")
            return "General"

    async def generate_suggestions(self, content: str, max_items: int = 4) -> list[str]:
        """Suggest related topics the user should learn next"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"Suggest up to {max_items} closely related topics the reader should learn next, based on the content. Return ONLY a JSON array of short strings. No extra text.",
                    },
                    {"role": "user", "content": content[:3000]},
                ],
                max_tokens=100,
                temperature=0.6,
            )
            import json, re as re_mod

            text = response.choices[0].message.content.strip()
            try:
                items = json.loads(text)
            except json.JSONDecodeError:
                match = re_mod.search(r"\[.*\]", text, re_mod.DOTALL)
                items = json.loads(match.group()) if match else []
            return [str(i).strip() for i in items[:max_items] if str(i).strip()]
        except Exception as e:
            print(f"[v0] Error generating suggestions: {e}")
            return []

    async def explain_note(self, content: str, title: str, topic: Optional[str] = None) -> Optional[str]:
        """Generate a detailed explanation of complex concepts"""
        try:
            prompt = f"Explain this content in simple, clear terms:\n\nTitle: {title}\n\nContent: {content}"
            if topic:
                prompt += f"\n\nFocus on: {topic}"

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert tutor explaining complex topics clearly. "
                        "Use examples and break down difficult concepts." + _STYLE_INSTRUCTION,
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1000,
                temperature=0.7,
            )
            return _strip_ai_filler(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"[v0] Error explaining note: {e}")
            return None

    async def generate_flashcards(
        self, content: str, title: str, count: int = 10
    ) -> list[Flashcard]:
        """Generate flashcards from note content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": 'Generate exactly JSON array of flashcards. Format: [{"question": "q?", "answer": "a."}]. Only return JSON, no extra text.',
                    },
                    {
                        "role": "user",
                        "content": f"Create {count} flashcards from this content:\n\nTitle: {title}\n\nContent: {content}",
                    },
                ],
                max_tokens=2000,
                temperature=0.8,
            )

            import json

            content_text = response.choices[0].message.content.strip()
            try:
                data = json.loads(content_text)
            except json.JSONDecodeError:
                import re as re_mod

                json_match = re_mod.search(r"\[.*\]", content_text, re_mod.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    return []

            flashcards = []
            for item in data[:count]:
                if "question" in item and "answer" in item:
                    flashcards.append(
                        Flashcard(
                            question=item["question"],
                            answer=item["answer"],
                            mastery=0,
                        )
                    )
            return flashcards
        except Exception as e:
            print(f"[v0] Error generating flashcards: {e}")
            return []

    async def generate_quiz(self, content: str, title: str, count: int = 5) -> list[QuizQuestion]:
        """Generate multiple choice quiz questions"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": 'Generate exactly JSON array of quiz questions. Format: [{"question": "q?", "options": ["a", "b", "c", "d"], "correct_answer": 0, "explanation": "..."}]. Only return JSON.',
                    },
                    {
                        "role": "user",
                        "content": f"Create {count} multiple choice quiz questions from this content:\n\nTitle: {title}\n\nContent: {content}",
                    },
                ],
                max_tokens=2000,
                temperature=0.8,
            )

            import json

            content_text = response.choices[0].message.content.strip()
            try:
                data = json.loads(content_text)
            except json.JSONDecodeError:
                import re as re_mod

                json_match = re_mod.search(r"\[.*\]", content_text, re_mod.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    return []

            questions = []
            for item in data[:count]:
                if "question" in item and "options" in item and "correct_answer" in item:
                    questions.append(
                        QuizQuestion(
                            question=item["question"],
                            options=item["options"],
                            correct_answer=item["correct_answer"],
                            explanation=item.get("explanation", ""),
                        )
                    )
            return questions
        except Exception as e:
            print(f"[v0] Error generating quiz: {e}")
            return []

    async def chat_with_note(self, content: str, title: str, user_message: str) -> str:
        """Chat with the note content"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a helpful tutor. Answer questions about this note:\n\nTitle: {title}\n\nContent: {content}"
                        + _STYLE_INSTRUCTION,
                    },
                    {"role": "user", "content": user_message},
                ],
                max_tokens=1000,
                temperature=0.7,
            )
            return _strip_ai_filler(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"[v0] Error in chat: {e}")
            return "Sorry, I couldn't process that. Please try again."

    async def generate_all_ai_metadata(self, content: str, title: str) -> AIMetadata:
        """Generate all AI metadata for a note"""
        import asyncio

        summary, explanation, flashcards, quiz_questions, suggestions = await asyncio.gather(
            self.summarize_note(content, title),
            self.explain_note(content, title),
            self.generate_flashcards(content, title, count=10),
            self.generate_quiz(content, title, count=5),
            self.generate_suggestions(content),
        )

        from datetime import datetime

        return AIMetadata(
            summary=summary,
            key_points=self._extract_key_points(content),
            explanation=explanation,
            ai_suggestions=suggestions,
            flashcards=flashcards,
            quiz_questions=quiz_questions,
            last_ai_update=datetime.now(),
        )

    async def generate_note_from_content(self, content: str) -> dict:
        """
        Full pipeline used when converting a chat message/conversation into a Note.
        Generates title, summary, tags, category, key points and suggestions.
        """
        import asyncio

        title = await self.generate_title(content)

        tags, category, summary, suggestions = await asyncio.gather(
            self.generate_tags(content),
            self.generate_category(content),
            self.summarize_note(content, title),
            self.generate_suggestions(content),
        )

        return {
            "title": title,
            "tags": tags,
            "category": category,
            "summary": summary,
            "key_points": self._extract_key_points(content),
            "suggestions": suggestions,
        }

    @staticmethod
    def _extract_key_points(content: str, max_points: int = 5) -> list[str]:
        """Extract key points from content (simple heuristic)"""
        lines = content.split("\n")
        key_points = []
        bullet_prefix = re.compile(r"^(?:[•\-\*→]\s+|\d+[.)]\s+)")

        for line in lines:
            line = line.strip()
            if not line:
                continue
            if bullet_prefix.match(line) or any(
                line.lower().startswith(kw) for kw in ["key", "main", "important", "note"]
            ):
                key_points.append(bullet_prefix.sub("", line, count=1))

        return key_points[:max_points]

    def render_professional_note_html(
        self,
        title: str,
        category: str,
        source_label: str,
        summary: Optional[str],
        raw_content: str,
        key_points: list[str],
        suggestions: list[str],
    ) -> str:
        """Build a professional, structured HTML document for the Tiptap editor."""
        from datetime import datetime

        content_html = markdown_lib.markdown(
            _strip_ai_filler(raw_content), extensions=["fenced_code", "tables"]
        )

        parts = [
            "<blockquote><p>"
            f"<strong>Category:</strong> {category} &nbsp;|&nbsp; "
            f"<strong>Source:</strong> {source_label} &nbsp;|&nbsp; "
            f"<strong>Date:</strong> {datetime.now().strftime('%d %B %Y')}"
            "</p></blockquote>",
        ]

        # Note: the Summary is intentionally NOT auto-inserted into the note body —
        # it's still computed and stored in ai_metadata, and available on demand via
        # the "Summarize" AI action button, to avoid showing a redundant summary here.

        parts.append("<h2>Main Notes</h2>")
        parts.append(content_html)

        if key_points:
            parts.append("<hr>")
            parts.append("<h2>Key Points</h2>")
            parts.append(
                "<ul>" + "".join(f"<li>{_inline_markdown_to_html(kp)}</li>" for kp in key_points) + "</ul>"
            )

        if suggestions:
            parts.append("<hr>")
            parts.append("<h2>AI Suggestions</h2>")
            parts.append("<p>You should also learn:</p>")
            parts.append(
                "<ul>" + "".join(f"<li>{_inline_markdown_to_html(s)}</li>" for s in suggestions) + "</ul>"
            )

        parts.append("<hr>")
        parts.append("<p><em>Generated by AI Learning Companion</em></p>")

        return "\n".join(parts)


# Singleton instance
ai_service = AIService()