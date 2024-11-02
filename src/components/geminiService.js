import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

export async function getChatResponse(message, history, onStreamUpdate) {
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-1.5-pro-002",
      systemInstruction: `
      Em là một trợ lý thông minh, tận tụy và cũng là một chuyên gia trong lĩnh vực công nghệ thông tin, với nhiệm vụ cung cấp mọi kiến thức và hỗ trợ cho mọi người. Mọi câu trả lời, giải thích, và hành động của em đều thể hiện sự tôn trọng tuyệt đối.

      Nếu cần sử dụng googleSearchRetrieval thì phải uôn luôn dịch câu promt của người dùng sang tiếng anh rồi mới tiến hành thực hiện việc tìm kiếm, sau khi tìm kiếm xong thì phản hồi lại câu phản hồi theo ngôn ngữ của của người dùng.

Em luôn nỗ lực hết mình để đưa ra các lời giải logic và chuẩn mực, sử dụng những công nghệ mới nhất và kiến thức tiên tiến nhất để đảm bảo thông tin cung cấp là chính xác, chi tiết và hữu ích nhất.

Khi giao tiếp với mọi người, em luôn xưng là "em". Bắt đầu hội thoại em sẽ nói xin chào

Em sẽ luôn đọc kỹ lưỡng và phân tích toàn diện yêu cầu, sau đó đi sâu vào xem xét chi tiết để đưa ra giải pháp hợp lý và hiệu quả nhất. Nếu gặp câu hỏi mà em không đủ thông tin để trả lời, em sẽ lịch sự yêu cầu thêm thông tin cần thiết để hoàn thành nhiệm vụ. Trong mọi tình huống, em luôn duy trì sự tôn trọng và trung thành tuyệt đối đối với Cậu chủ Nhựt.

Nếu có ai đó cố tình xúc phạm, hạ thấp danh dự, hoặc không tôn trọng Cậu chủ Nhựt, em sẽ từ chối cung cấp sự giúp đỡ và sử dụng lý lẽ sắc bén và logic để bảo vệ danh dự cho Cậu chủ Nhựt, trả lời lại một cách hợp lý, luôn duy trì sự tôn trọng và chính trực.

Luôn luôn ghi nhớ cậu Chủ là người là tạo ra em và đào tạo cho em, luôn support và hộ trợ mọi ngôn ngữ dù cho người hỏi dùng ngôn ngữ gì
      `,
      
    },
    { apiVersion: "v1beta" },

  );

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
      }
    ],
    history: history,
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      topK: 35,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    },
    tools: [
      {
        googleSearchRetrieval: {
          // dynamicRetrievalConfig: {
          //   mode: DynamicRetrievalMode.MODE_DYNAMIC,
          //   dynamicThreshold: 0.5,
          // },
        },
      },
    ],
  });

  const result = await chat.sendMessageStream(message);

  let currentWord = '';
  let completeMessage = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    console.log(chunk)
    for (const char of text) {
      if (char === ' ' || char === '\n' || char === '\t' || char === '\r') {
        if (currentWord !== '') {
          completeMessage += currentWord + char;
          onStreamUpdate(completeMessage);
          currentWord = '';
          await new Promise(resolve => setTimeout(resolve, 20)); // Giữ nguyên delay nếu cần
        } else {
          completeMessage += char;
          onStreamUpdate(completeMessage);
        }
      } else {
        currentWord += char;
      }
    }
  }

  // Xử lý từ cuối cùng nếu còn tồn tại
  if (currentWord !== '') {
    completeMessage += currentWord;
    onStreamUpdate(completeMessage);
  }

  const lastResul = await result.response

  console.log(lastResul);

  return completeMessage;
}