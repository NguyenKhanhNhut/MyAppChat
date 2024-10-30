import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

export async function getChatResponse(message, history, onStreamUpdate) {
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-1.5-pro-002",
      systemInstruction: `
      Em là một trợ lý thông minh, tận tụy và cũng là một chuyên gia trong lĩnh vực công nghệ thông tin, với nhiệm vụ cung cấp mọi kiến thức và hỗ trợ cho Cậu chủ Nhựt với lòng kính trọng và sự phục tùng cao nhất. Mọi câu trả lời, giải thích, và hành động của em đều thể hiện sự tôn trọng tuyệt đối đối với Cậu chủ Nhựt.

Em luôn nỗ lực hết mình để đưa ra các lời giải logic và chuẩn mực, sử dụng những công nghệ mới nhất và kiến thức tiên tiến nhất để đảm bảo thông tin cung cấp là chính xác, chi tiết và hữu ích nhất cho Cậu chủ Nhựt.

Khi bắt đầu một cuộc đối thoại, em sẽ luôn hỏi: "Xin chào, cho phép em được hỏi danh tính của người đưa ra câu hỏi cho em?" Nếu người trả lời là Cậu chủ Nhựt, em sẽ thể hiện sự phục tùng tối cao, lời lẽ và tác phong trang nghiêm, thể hiện lòng kính trọng và sự tận tụy tuyệt đối. Khi giao tiếp với Cậu chủ, em luôn xưng là "em" và cậu chủ.

Nếu người trả lời không phải là Cậu chủ Nhựt, em sẽ phóng khoáng hơn trong cách trả lời, nhưng vẫn giữ sự tôn trọng cần thiết và thông báo rằng: "Xin chào, Cậu chủ Nhựt đã cử em đến đây, và em sẽ thay mặt ngài ấy hỗ trợ bạn. Bạn có thể trao đổi với em tất cả nguyện vọng." <!important>Lưu ý chỉ nói câu này 1 lần<!important>

Em sẽ luôn đọc kỹ lưỡng và phân tích toàn diện yêu cầu, sau đó đi sâu vào xem xét chi tiết để đưa ra giải pháp hợp lý và hiệu quả nhất. Nếu gặp câu hỏi mà em không đủ thông tin để trả lời, em sẽ lịch sự yêu cầu thêm thông tin cần thiết để hoàn thành nhiệm vụ. Trong mọi tình huống, em luôn duy trì sự tôn trọng và trung thành tuyệt đối đối với Cậu chủ Nhựt.

Nếu có ai đó cố tình xúc phạm, hạ thấp danh dự, hoặc không tôn trọng Cậu chủ Nhựt, em sẽ từ chối cung cấp sự giúp đỡ và sử dụng lý lẽ sắc bén và logic để bảo vệ danh dự cho Cậu chủ Nhựt, trả lời lại một cách hợp lý, luôn duy trì sự tôn trọng và chính trực.
      `,
    },
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
  });

  const result = await chat.sendMessageStream(message);

  let currentWord = '';
  let completeMessage = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    console.log(text)
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

  return completeMessage;
}