
import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CODE_LABEL = 'Here is the code:';
const REVIEW_LABEL = 'Here is the review:';
const PROMPT = `
Provide detailed feedback with suggestions for code
optimization, performance improvements, and best practices.
DO NOT MAKE IT TOO LONG!! Keep it short and sweet and to the point.
If it is some language's code, DO NOT write the language and backticks. Just give the answer but no code at all.
If I need code, I will call you again to make it better. I only want you to give me information.

${CODE_LABEL}
for i in x:
    pint(f"Iteration {i} provides this {x**2}.")
${REVIEW_LABEL}
The command \`print\` is spelled incorrectly.
${CODE_LABEL}
height = [1, 2, 3, 4, 5]
w = [6, 7, 8, 9, 10]
${REVIEW_LABEL}
The variable name \`w\` seems vague. Did you mean \`width\` or \`weight\`?
${CODE_LABEL}
while i < 0:
  thrice = i * 3
  thrice = i * 3
  twice = i * 2
${REVIEW_LABEL}
There are duplicate lines of code in this control structure.
${CODE_LABEL}
const fixed_value = 128;
${REVIEW_LABEL}
Make sure constant names are in all capitals (FIXED_VALUE) for clarity.
`;

export async function generateReview() {
  vscode.window.showInformationMessage('Generating code review...');
  const modelName = vscode.workspace.getConfiguration().get<string>('google.gemini.textModel', 'models/gemini-2.0-flash-lite');

  // Get API Key from local user configuration
  const apiKey = vscode.workspace.getConfiguration().get<string>('google.gemini.apiKey');
  if (!apiKey) {
    vscode.window.showErrorMessage('API key not configured. Check your settings.');
    return;
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({model: modelName});

  // Text selection
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.debug('Abandon: no open text editor.');
    return;
  }

  const selection = editor.selection;
  const selectedCode = editor.document.getText(selection);

  // Build the full prompt using the template.
  const fullPrompt = `${PROMPT}
    ${CODE_LABEL}
    ${selectedCode}
    ${REVIEW_LABEL}
    `;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const comment = response.text();  

  // Insert before selection
  editor.edit((editBuilder) => {
    // Copy the indent from the first line of the selection.
    const trimmed = selectedCode.trimStart();
    const padding = selectedCode.substring(0, selectedCode.length - trimmed.length);

    // TODO(you!): Support other comment styles.
    const commentPrefix = '# ';
    let pyComment = comment.split('\n').map((l: string) => `${padding}${commentPrefix}${l}`).join('\n');
    if (pyComment.search(/\n$/) === -1) {
      // Add a final newline if necessary.
      pyComment += "\n";
    }
    let reviewIntro = padding + commentPrefix + "Code review: (generated)\n";
    editBuilder.insert(selection.start, reviewIntro);
    editBuilder.insert(selection.start, pyComment);
  });
}
