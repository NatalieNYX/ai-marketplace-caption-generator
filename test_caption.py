from ai.watch_agent import WatchCaptionAgent

agent = WatchCaptionAgent()

caption = agent.generate_caption(
    image_path = "ai/test_image/Seiko16-5290.jpeg",
    model_name = "Seiko 16-5290",
    condition = "Well Used",
    extras = "Comes As-Is, recently changed battery, aftermarket leather strap, working condition",
)

print(caption)