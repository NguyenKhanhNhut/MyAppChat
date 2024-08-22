import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

export async function getChatResponse(message, history) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-exp-0801" });

  const chat = model.startChat({
    safetySettings : [
      {
          "category": "HARM_CATEGORY_HARASSMENT",
          "threshold": "BLOCK_NONE",
      },
      {
          "category": "HARM_CATEGORY_HATE_SPEECH",
          "threshold": "BLOCK_NONE",
      },
      {
          "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "threshold": "BLOCK_NONE",
      },
      {
          "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
          "threshold": "BLOCK_NONE",
      },
  ],
    history: history, 
    generationConfig: {
      maxOutputTokens: 8000,
    },
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  console.log(response.text())
  return response.text();
}
