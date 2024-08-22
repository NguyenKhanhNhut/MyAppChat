const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI('AIzaSyADMJKzlZmu0M4PUX8ZdcgHyZvRYc04VI0');

var history = [
    {
      role: "user",
      parts: [{ text: "Luôn gọi tôi là chủ nhân, tuân mọi mệnh lệnh từ tôi" }],
    },
    {
      role: "model",
      parts: [{ text: "Dạ thưa chủ nhân em xin đợi lệnh" }],
    },
  ]

async function getChatResponse(message, history) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

    // Change: Use sendMessageStream instead of sendMessage
    const result = await chat.sendMessageStream(message);
    for await (const chunk of result.stream) {
        console.log(chunk.text());
        
      }
}

getChatResponse('tool use của claude ai',history)
