import {Anthropic} from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: "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",
});

const msg = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20240620",
  max_tokens: 1000,
  temperature: 0,
  messages: [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "kiến thức mới nhất của bạn"
        }
      ]
    }
  ]
});
console.log(msg);