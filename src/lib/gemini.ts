import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPersonalizedRecommendations(readingHistory: string[], genres: string[]) {
  const prompt = `Based on the following reading history: ${readingHistory.join(", ")} and preferred genres: ${genres.join(", ")}, suggest 5 books. Return the result as a JSON array of objects with title, author, and a brief reason for the recommendation.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["title", "author", "reason"],
        },
      },
    },
  });

  return JSON.parse(response.text);
}

export async function extractMetadataFromImage(base64Image: string) {
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  };
  const textPart = {
    text: "Extract the book title, author name, and genre from this book cover. Also, provide a short description of the book based on its title and author. Return the result as a JSON object with title, author, genre, and description.",
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          genre: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "author", "genre", "description"],
      },
    },
  });

  return JSON.parse(response.text);
}
