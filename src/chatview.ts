import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function openGeminiChat() {
    // Create a new webview panel
    const panel = vscode.window.createWebviewPanel(
        'geminiChat',
        'Wingman Chatbot',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    // Set the webview content
    panel.webview.html = getWebviewContent();

    // Listen for messages from the webview
    panel.webview.onDidReceiveMessage(
        async (message) => {
            const response = await queryGemini(message.question);
            panel.webview.postMessage({ answer: response });
        },
        undefined,
        []
    );
}

// Function to get the API response from Gemini
async function queryGemini(prompt: string): Promise<string> {
    // Combine the custom prompt with the user input
    const customPrompt = `Below is an instruction that describes a task. 
    Write a response that appropriately completes the request.
    MAKE SURE you're answer is very short and concise. If you need
    more context, then ask for it. If someone asks to understand something, give 
    steps how to understand it in very short steps
    \n\n
    `;
    const fullPrompt = customPrompt + prompt;

    const modelName = vscode.workspace.getConfiguration().get<string>('google.gemini.textModel', 'models/gemini-2.0-flash-lite');
    const apiKey = vscode.workspace.getConfiguration().get<string>('google.gemini.apiKey');

    if (!apiKey) {
        vscode.window.showErrorMessage('API key not configured. Check your settings.');
        return 'API key not configured.';
    }

    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || 'No response from Wingman.';
}

// Function to generate HTML for the webview panel
function getWebviewContent(): string {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wingman Chat</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #0d1117;
            color: #c9d1d9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        h2 {
            color: #c6ddf5;
            text-align: center;
            margin-bottom: 20px;
            font-size: 40px;
            font-weight: 600;
        }
        .messages {
            width: 100%;
            max-width: 800px;
            height: 300px;
            overflow-y: auto;
            padding: 8px;
            background-color: #161b22;
            border-radius: 8px;
            margin-bottom: 20px;
            scroll-behavior: smooth;
            border: 1px solid #30363d;
        }
        .messages p {
            margin: 5px 0;
            padding: 8px;
            border-radius: 6px;
            line-height: 1.5;
            animation: fadeIn 0.3s ease;
        }
        .messages p.user {
            background-color: #21262d;
            border-left: 4px solid #58a6ff;
        }
        .messages p.bot {
            background-color: #161b22;
            border-left: 4px solid #238636;
        }
        .messages p b {
            font-weight: 600;
            color: #58a6ff;
        }
        .messages code {
            background-color: #21262d;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            color: #c9d1d9;
        }
        .messages pre {
            background-color: #21262d;
            padding: 8px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 8px 0;
        }
        .messages pre code {
            background-color: transparent;
            padding: 0;
        }
        .input-container {
            width: 100%;
            max-width: 800px;
            display: flex;
            gap: 10px;
            padding: 0 10px;
        }
        input {
            flex: 1;
            padding: 12px;
            border: 1px solid #30363d;
            border-radius: 6px;
            font-size: 16px;
            outline: none;
            background-color: #0d1117;
            color: #c9d1d9;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        input:focus {
            border-color: #58a6ff;
            box-shadow: 0 0 8px rgba(88, 166, 255, 0.3);
        }
        button {
            padding: 12px 20px;
            background-color: #238636;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }
        button:hover {
            background-color: #2ea043;
            transform: scale(1.05);
        }
        button:active {
            transform: scale(0.95);
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .messages::-webkit-scrollbar {
            width: 8px;
        }
        .messages::-webkit-scrollbar-track {
            background: #161b22;
            border-radius: 4px;
        }
        .messages::-webkit-scrollbar-thumb {
            background: #30363d;
            border-radius: 4px;
        }
        .messages::-webkit-scrollbar-thumb:hover {
            background: #58a6ff;
        }
    </style>
</head>
<body>
    <h2>Wingman Chat</h2>
    <div class="messages" id="messages">
    </div>
    <div class="input-container">
        <input type="text" id="userInput" placeholder="Ask something...">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('userInput').value;
            if (!input) return;

            // Display user's message
            document.getElementById('messages').innerHTML += '<p class="user"><b>You:</b> ' + input + '</p>';
            document.getElementById('userInput').value = '';

            // Send the input (will be combined with custom prompt in the extension)
            vscode.postMessage({ question: input });

            const messagesDiv = document.getElementById('messages');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        window.addEventListener('message', event => {
            const message = event.data;
            document.getElementById('messages').innerHTML += '<p class="bot"><b>Gemini:</b> ' + message.answer + '</p>';

            const messagesDiv = document.getElementById('messages');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
    </script>
</body>
</html>`;
}
