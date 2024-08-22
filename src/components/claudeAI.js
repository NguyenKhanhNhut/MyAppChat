const { AnthropicVertex } = require('@anthropic-ai/vertex-sdk');
const readline = require('readline');
const fetch = require('node-fetch'); // Add this for fetching URL content

// Configure readline to read from the standard input and output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});
process.stdin.setEncoding('utf8');

const client = new AnthropicVertex({
  region: process.env.CLOUD_ML_REGION || "europe-west1",
  projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID || "oceanic-grin-371614"
});

let history = [];

async function fetchUrlContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching URL content:", error);
    return "Unable to fetch content from the provided URL.";
  }
}

async function getChatResponse(message) {
  // Add the new user message to the history
  history.push({ role: 'user', content: message });

  // Convert history to the format expected by Anthropic Vertex
  const formattedHistory = history.map(entry => ({
    role: entry.role,
    content: entry.content
  }));

  try {
    const result = await client.messages.create({
      tools: [
        {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "input_schema": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA",
              }
            },
            "required": ["location"],
          },
        },
        {
          "name": "get_current_time",
          "description": "Get the current time in a given timezone",
          "input_schema": {
            "type": "object",
            "properties": {
              "timezone": {
                "type": "string",
                "description": "The timezone, e.g. America/New_York",
              }
            },
            "required": ["timezone"],
          },
        },
        {
          "name": "fetch_url",
          "description": "Fetch the text content from a given URL",
          "input_schema": {
            "type": "object",
            "properties": {
              "url": {
                "type": "string",
                "description": "The URL to fetch content from",
              }
            },
            "required": ["url"],
          },
        }
      ],
      messages: formattedHistory,
      model: 'claude-3-5-sonnet@20240620',
      max_tokens: 4000
    });

    // Assume the response contains instructions on which tool to execute
    let finalResponse = result.content;
    let finalResponseText = result.content[0].text

    if (finalResponse[result.content.length - 1].name === "fetch_url") {
      const url = finalResponse[result.content.length - 1].input.url;
      const urlContent = await fetchUrlContent(url);
      finalResponseText = `Content fetched from the URL: ${urlContent}`;
      history.push({ role: 'assistant', content: finalResponseText });
      return result.content[0].text;
    } else if (finalResponse.name === "get_current_time") {
      finalResponseText = getCurrentTime(finalResponse.input.timezone);
    }

    // Add the assistant's response to the history
    history.push({ role: 'assistant', content: finalResponseText });

    // Return the final response text
    return finalResponseText;
  } catch (error) {
    console.error("Error in getChatResponse:", error);
    return "There was an error processing your request.";
  }
}

function getCurrentTime(timezone) {
  // This should be implemented to actually fetch current time
  return `Thời gian hiện tại ở ${timezone}: ${new Date().toLocaleString("en-US", { timeZone: timezone })}`;
}

function promptUser() {
  rl.question("Nhập câu hỏi của bạn: ", async function (line) {
    const response = await getChatResponse(line);

    console.log("Assistant's response:", response);

    // Continue prompting the user
    promptUser();
  });
}

// Start the interaction loop
promptUser();

// Make sure to handle exits gracefully
rl.on('close', function () {
  console.log('\nGoodbye!');
  process.exit(0);
});
