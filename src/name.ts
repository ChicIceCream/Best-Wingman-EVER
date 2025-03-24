import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `
Given this Python function, rewrit the function's name it with an appropriate name that 
reflects what it does. As functions go, keep it in one word or two words max joined by an underscore
Return ONLY the complete function with the new name, followed by a brief 
explanation (2 sentences max) on a new line after the function code.
Do not include any additional text, markdown formatting, or code blocks.
BUT do not change the function. Keep the spacing, lines, functions and everything else the same.
If you think you can improve this function, DO NOT DO IT! Keep it the same. You are only 
require to change the name of the functiona and that is it. Thanks! 
`;

export async function generateName() {
    console.log('Starting generateName function');
    vscode.window.showInformationMessage('Generating function name...');
    
    const modelName = vscode.workspace.getConfiguration().get<string>('google.gemini.textModel', 'models/gemini-2.0-flash-lite');
    const apiKey = vscode.workspace.getConfiguration().get<string>('google.gemini.apiKey');
    
    console.log(`Using model: ${modelName}`);
    
    if (!apiKey) {
        console.error('API key not configured');
        vscode.window.showErrorMessage('API key not configured. Check your settings.');
        return;
    }
    
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({model: modelName});
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.error('No active text editor');
        vscode.window.showErrorMessage('No active text editor found');
        return;
    }
    
    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection);
    
    console.log(`Selected code length: ${selectedCode.length}`);
    console.log(`Selected code snippet: ${selectedCode.substring(0, 100)}...`);
    
    if (!selectedCode || selectedCode.trim() === '') {
        console.error('No code selected');
        vscode.window.showErrorMessage('No code selected. Please select a function to rename.');
        return;
    }
    
    // Build the full prompt
    const fullPrompt = `${PROMPT}\n${selectedCode}`;
    
    try {
        console.log('Sending request to Gemini API');
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text();
        
        console.log(`Received response length: ${responseText.length}`);
        console.log(`Response preview: ${responseText.substring(0, 100)}...`);
        
        // Split the response into code and explanation
        // Find the first blank line after the function definition
        const lines = responseText.split('\n');
        let codeEndIndex = lines.findIndex((line, index) => 
            line.trim() === '' && index > 0 && 
            (lines[index-1].trim().startsWith('return') || 
                lines[index-1].includes(':') === false)
        );
        
        if (codeEndIndex === -1) {
            // If no blank line found then just try other lines
            codeEndIndex = lines.findIndex((line, index) => 
                index > 0 && 
                !line.startsWith(' ') && 
                !line.startsWith('\t') && 
                lines[index-1].startsWith(' ')
            );
        }
        
        console.log(`Detected code end at line: ${codeEndIndex}`);
        
        let newCode, explanation;
        
        if (codeEndIndex !== -1) {
            newCode = lines.slice(0, codeEndIndex).join('\n');
            explanation = lines.slice(codeEndIndex).join('\n').trim();
        } else {
            // If we can't detect a clear separation, assume most is code with last line as explanation
            newCode = lines.slice(0, -1).join('\n');
            explanation = lines[lines.length - 1];
        }
        
        console.log(`Extracted code length: ${newCode.length}`);
        console.log(`Extracted explanation: ${explanation}`);
        
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, newCode);
            console.log('Edit applied');
        }).then(success => {
            console.log(`Edit success: ${success}`);
            if (success && explanation) {
                // Show explanation as notification
                vscode.window.showInformationMessage(explanation);
                
                setTimeout(() => {
                    vscode.commands.executeCommand('notifications.clearAll');
                }, 10000); // how much time noti shows
            }
        });
        
    } catch (error) {
        console.error('Error during AI request or processing:', error as any);
        vscode.window.showErrorMessage(`Error generating function name: ${(error as any).message || 'Unknown error'}`);
    }
}