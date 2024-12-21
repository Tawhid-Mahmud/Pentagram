import modal
import os 
from fastapi import Response, HTTPException, Query, Request
from datetime import datetime, timezone
import requests 
import io 

def download_model():
    from diffusers import AutoPipelineForText2Image
    import torch

    AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
    )
    
image = (modal.Image.debian_slim()
        .pip_install("fastapi[standard]", "transformers", "diffusers",
                     "requests", "torch")
                     .run_function(download_model))

app = modal.App("sd-demo",image=image)

@app.cls(
    image=image,
    gpu="A10G",
    container_idle_timeout=300,
    secrets = [modal.Secret.from_name("API_KEY")]
)
class Model:

    @modal.build()
    @modal.enter()
    def load_weights(self):
        from diffusers import AutoPipelineForText2Image
        import torch

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
        )

        self.pipe.to("cuda")
        self.API_KEY = os.environ["API_KEY"]

    @modal.web_endpoint()
    def generate_image(self, request: Request, prompt: str = Query(..., description="The prompt to generate an image from")):
        
        api_key = request.headers.get("X-API-KEY")
        if api_key != self.API_KEY:
            raise HTTPException(
                status_code=401, 
                detail="Unauthorized"
                )
        
        image = self.pipe(prompt, num_inference_steps=1, guidance_scale=0.0).images[0]
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        return Response(content=buffer.getvalue(), media_type="image/jpeg")
    
    @modal.web_endpoint()
    def health_check(self):
        """Lightweight endpoint for keeping the container alive"""
        return{"Status": "HEALTHY", "Timestamp": datetime.now(timezone.utc).isoformat()}
    
@app.function(
    schedule=modal.Cron("*/5 * * * *"),
    secrets=[modal.Secret.from_name("API_KEY")]
)
def keep_alive():
    health_check_url = "ADD YOUR OWN END POINT AFTER DEPLOYING"
    generate_url = "ADD YOUR OWN END POINT AFTER DEPLOYING"

    health_response = requests.get(health_check_url)
    print(f"Health check at: {health_response.json()['Timestamp']}")

    headers = {"X-API-KEY": os.environ["API_KEY"]}
    generate_response = requests.get(generate_url, headers=headers)
    print(f"Generate endpoint tested successfully at: {datetime.now(timezone.utc).isoformat()}")
 
