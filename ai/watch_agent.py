import os 
import sys 
import base64
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

from ai.prompts import SYSTEM_PROMPT

#load .env variable as soon as this module is imported
load_dotenv()

# Class that generates watch caption using Google Gemini to analyse watch photo and user inputs
class WatchCaptionAgent:
    MODEL_NAME = "gemini-2.5-flash-lite"

    # Constructor to run when run WatchCaptionAgent()
    # Set up Gemini Client and configure the models with system prompt
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY not found in environment variables. Please set it in your .env file."
            )
        
        # Creates a client object for the Google Generative AI API, which will be used to send requests to the Gemini model and receive responses. 
        # The api_key is passed to authenticate the client with the API.
        self.client = genai.Client(api_key=api_key)

    
    # Private helper that wont be called outside of this class 
    # Loads an image and returns it in format Part that Gemini can understand, which includes the MIME type and the base64-encoded image data
    def _load_image(self, image_path:str) -> types.Part: 
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
        
        # rb means read binary and return as byte data, which is what we need to encode the image in base64
        with open(image_path, "rb") as f:
            # b64encode converts binary data -> base64-encoded byte -> decoded string, which is a text representation of the image that can be easily transmitted in JSON format
            image_data = base64.b64encode(f.read()).decode("utf-8")

        # Return the base64-encoded image data itself and mime type so that Gemini knows how to interpret the data
        # Part represents content block 
        # .from_bytes is a constructor method that creates a Part object from raw byte data, which is the format Gemini expects for inline data like images.
        return types.Part.from_bytes(
            data=base64.b64decode(image_data),
            mime_type=mime_type
        )
    
    # Public method to generate watch caption, which will be called outside of this class
    def generate_caption(
        self,
        image_path: str, # watch image
        model_name: str, # watch model name
        condition: str, # condition -> brand new, like new, well used, heavily used
        extras: str = "", # optional attributes -> with box and papers, aftermarket strap
    ) -> str: # Returns the caption
        
        valid_conditions = {"Brand New", "Like New", "Well Used", "Heavily Used"}
        if condition not in valid_conditions:
            raise ValueError(
                f"Invalid conditions '{condition}'."
                f"Choose from {', '.join(valid_conditions)}"
            )
        
        image_part = self._load_image(image_path)

        # Build a user prompt in detail that explicitly tells Gemini what exactly each field means 
        user_prompt = f"""
Please generate a marketplace lisiting caption based on this watch specification:
Watch Model : {model_name}
Condition : {condition}
Additional Details : {extras if extras else "None provided"}

Instructions: 
- Look at the watch photo and infer any notable features that can be highlighted in the listing, such as colour, case size, dial design, strap type, etc.
- Infer specs (movement, case size, water resistance, features) from model name 
- Write a caption in the style of a high-perfroming Malaysian Carousell / Facebook Marketplace listing
- End with a clear call to action (DM to enquire, offer postage of meet up, etc.)
"""
        
        # Gemini multimodel class: we pass both the image and text together 
        response = self.client.models.generate_content(
            model = self.MODEL_NAME,
            contents = [image_part, user_prompt],
            config = types.GenerateContentConfig(
                system_instruction = SYSTEM_PROMPT
            ),
        )

        #strip removes extra whitespace from the beginning and end of the generated caption, ensuring a clean output
        return response.text.strip()
    
    
# when watch_agent.py is run directly, this block will execute
if __name__ == "__main__":
    # #test if the arguments passed in the command line are less than 4 (script name, image path, model name, condition, extras)
    # if len(sys.argv) < 4:
    #     print(
    #         "Usage: python watch_agent.py"
    #         "<image_path> <model_name> <conditon> [extras]",
    #         file = sys.stderr,
    #     )
    #     sys.exit(1) # exit with error code 1 if not enough arguments
    
    # image_path = sys.argv[1]
    # model_name = sys.argv[2]
    # condition = sys.argv[3]
    # extras = sys.argv[4] if len(sys.argv) > 4 else ""

    # agent = WatchCaptionAgent()
    # caption = agent.generate_caption(image_path, model_name, condition, extras)
    # print (caption)
    #==========================================================================

    # Read everything Node.js sends through stdin 
    raw = sys.stdin.read()
    # Pase the JSOn string into a Python dictionary 
    data = json.loads(raw)
    # Pull out each field from the dictionary
    image_path = data["image_path"]
    model_name = data["model_name"]
    condition = data["condition"]
    extras = data.get("extras", "")  # Use .get() if there is possibility of missing values

    # Create agent and generate caption
    agent = WatchCaptionAgent()
    caption = agent.generate_caption(image_path, model_name, condition, extras)
    # Print results as JSON to stdout -> Node.js will read this 
    # This must only print in the script 
    print(json.dumps({"caption": caption}))



        
        

        
        
        

        
        



        

