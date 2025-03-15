import * as vscode from 'vscode';
import { generateReview } from './review';
import { generateName } from './name';
import { generateTestcases } from './testcase';
import { openGeminiChat } from './chatview';
import { registerInlineCompletionProvider, toggleAutoSuggestions } from './realtime';
import { generateComplexity } from './complexity';
import { generateComment } from './comments';

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand('wingman-code-agent.reviewCode', generateReview);
    vscode.commands.registerCommand('wingman-code-agent.nameFunction', generateName);
    vscode.commands.registerCommand('wingman-code-agent.testcases', generateTestcases);
    vscode.commands.registerCommand('wingman-code-agent.openGeminiChat', openGeminiChat);
    vscode.commands.registerCommand('wingman-code-agent.toggleAutoSuggestions', toggleAutoSuggestions);
    vscode.commands.registerCommand('wingman-code-agent.complexity', generateComplexity);
    vscode.commands.registerCommand('wingman-code-agent.commentCode', generateComment);



    // **Register inline completions provider**.
    registerInlineCompletionProvider(context);
}

export function deactivate() { }
