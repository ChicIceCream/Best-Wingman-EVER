import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `
Give me the time complexity of the code selected:
Keep it very short. Only give the time complexity such as :
O(n) or O(1)
NOTHING ELSE!!!
`;

export async function generateComplexity() {
    vscode.window.showInformationMessage('Finding Time Complexity...');

    const modelName = vscode.workspace.getConfiguration().get<string>('google.gemini.textModel', 'models/gemini-2.0-flash-lite');

    // Get API Key
    const apiKey = vscode.workspace.getConfiguration().get<string>('google.gemini.apiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('API key not configured. Check your settings.');
        return;
    }

    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: modelName });

    // Text selection
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.debug('Abandon: no open text editor.');
        return;
    }

    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection);

    const fullPrompt = `${PROMPT}\n\n${selectedCode}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const complexity = response.text();

    // Show the response as a notification
    vscode.window.showInformationMessage(`Time Complexity: ${complexity}`);
}
