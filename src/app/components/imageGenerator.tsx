"use client";

// Added useEffect to load images form local storage
import { useState, useEffect } from "react";

interface ImageGeneratorProps {
    generateImage: (
        text: string
    ) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}
export default function ImageGenerator({ generateImage }: ImageGeneratorProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load images from local 
  useEffect(() => {
    const savedImages = localStorage.getItem('generatedImages');
    if (savedImages) {
      setGeneratedImages(JSON.parse(savedImages));
    }
  }, []);

  // Save images to localStorage 
  useEffect(() => {
    localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
  }, [generatedImages]);





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setError(null);

    try {
      const result = await generateImage(inputText);
      
      
      if (!result.success) {
        throw new Error(result.error || "failed to generate image.");
      }

      if(result.imageUrl) {
        const img = new Image();
        img.onload = () => {
          setGeneratedImages(prev => [{ url: result.imageUrl! }, ...prev]);
        };
        img.src = result.imageUrl;
      }

      setInputText("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Clear images from local storage
    setGeneratedImages([]);
    // Clear localStorage
    localStorage.removeItem('generatedImages');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-cyan-200 to-blue-200 dark:from-cyan-900 dark:to-blue-900">
      {/* Sidebar */}
      <aside className="w-96 p-6 border-r border-black/[.08] dark:border-white/[.105] bg-black/[.02] dark:bg-white/[.02]">
        <form onSubmit={handleSubmit} className="sticky top-6">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="Describe the image you want to generate..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
            
            {/* Reset Button */}
            {generatedImages.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Clear All Images
              </button>
            )}
          </div>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {generatedImages.map((image, index) => (
            <div 
              key={index}
              className="w-full rounded-lg overflow-hidden shadow-lg border border-black/[.08] dark:border-white/[.105]"
            >
              <img
                src={image.url}
                alt={`Generated Image ${index + 1}`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
