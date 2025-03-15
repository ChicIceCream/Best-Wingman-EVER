import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CODE_LABEL = 'Here is the code:';
const TESTCASE_LABEL = 'Here is a good testcase format:';

const PROMPT = `
A good code only works robustly when it can pass through many harsh testcases.
Generate at least 5 test cases for the code given.
From the selected text, get the function name and the arguments that it takes.
Using the function name and the function arguments, generate ready-to-execute test cases.
Do not include any additional text like "Test Case 1:" or "Expected output:".
Only include valid Python code with print statements that can be executed directly.
Do not write any backticks or python specifier.
Here are some examples:

${CODE_LABEL}
def register_check(register):
    counter = 0
    for key in register:
        if register[key] == 'yes':
            counter += 1
    return counter

${TESTCASE_LABEL}
print(register_check({'John': 'yes', 'Mary': 'no', 'Bob': 'no'}))

${CODE_LABEL}
def add_numbers(a, b):
    return a + b

${TESTCASE_LABEL}
print(add_numbers(2, 3))
print(add_numbers(-1, 5))
print(add_numbers(0, 0))

${CODE_LABEL}
def is_even(n):
    return n % 2 == 0

${TESTCASE_LABEL}
print(is_even(4))
print(is_even(7))
print(is_even(0))
print(is_even(-2))
`;

export async function generateTestcases() {
    vscode.window.showInformationMessage('Generating test cases...');

    const modelName = vscode.workspace.getConfiguration().get<string>('google.gemini.textModel', 'models/gemini-2.0-flash-lite');

    const apiKey = vscode.workspace.getConfiguration().get<string>('google.gemini.apiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('API key not configured. Check your settings.');
        return;
    }

    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({model: modelName});

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.debug('Abandon: no open text editor.');
        return;
    }

    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection);

    const fullPrompt = `${PROMPT}\n${selectedCode}\n`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const testCases = response.text();

    // Input test casees below the code ofr easea in running
    editor.edit((editBuilder) => {
        const trimmed = selectedCode.trimStart();
        const padding = selectedCode.substring(0, selectedCode.length - trimmed.length);

        let formattedTestCases = testCases.split('\n').map((line: string) => `${padding}${line}`).join('\n');
        if (formattedTestCases.search(/\n$/) === -1) {
            formattedTestCases += "\n";
        }

        editBuilder.insert(selection.end, `\n${formattedTestCases}`);
    });
}
