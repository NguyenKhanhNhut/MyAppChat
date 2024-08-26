import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

export async function getChatResponse(message, history, onStreamUpdate) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const chat = model.startChat({
    safetySettings: [
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

  const result = await chat.sendMessageStream(message);

  let completeMessage = '';

  for await (const chunk of result.stream) {
    const text = chunk.text(); // Lấy văn bản từ chunk
    const words = text.split(' '); // Chia văn bản thành từng từ

    for (let i = 0; i < words.length; i++) {
      if(words.length <2) {
        completeMessage += words[i]
      } else {
        completeMessage += words[i]+' '; // Thêm từng từ vào completeMessage
      }
      onStreamUpdate(completeMessage); // Cập nhật UI sau mỗi từ

      // Đợi một khoảng thời gian ngắn để tạo hiệu ứng đánh chữ từng từ
      await new Promise(resolve => setTimeout(resolve, 25)); // Điều chỉnh độ trễ cho tốc độ đánh chữ từng từ
    }
  }

  return completeMessage;
}


