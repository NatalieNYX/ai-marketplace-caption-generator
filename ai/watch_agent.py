import os 
import sys 
import base64
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

from prompts import SYSTEM_PROMPT

#load .env variable as soon as this module is imported
load_dotenv()

# Class that generates watch caption using Google Gemini to analyse watch photo and user inputs
class WatchCaptionAgent:
    MODEL_NAME = "gemini-1.5-flash"

    # Constructor to run when run WatchCaptionAgent()
    # Set up Gemini Client and configure the models with system prompt
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY not found in environment variables. Please set it in your .env file."
            )
        
        genai.configure(api_key=api_key)

        # The GenerativeModel object hold our system prompt permanetly
        # Every call made through self.model will carry this context 
        self.model = genai.GenerativeModel(self.MODEL_NAME, system_prompt=SYSTEM_PROMPT)

    
    # Private helper that wont be called outside of this class 
    # Return dictionary 
    # Reads an image file and converts it to dict format 
    def _load_image(self, image_path:str) -> dict: 
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found at path: {image_path}")

        # Infer MIME type from file extension
        # MIME tells a program what kind of file is it so it knows how to handle
        extension_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp"
        }

        mime_type = extension_map.get(path.suffix.lower())
        if not mime_type:
            raise ValueError(f"Unsupported image format: {path.suffix}. Supported formats are: {', '.join(extension_map.keys())}")
        
        



        

