const vscode = require('vscode')
const {exec} = require('child_process')
const {basename} = require('path')

let lastCommand

function activate(context) {
	let runAllCommand = vscode.commands.registerCommand('extension.runAll', runAll)
	context.subscriptions.push(runAllCommand)

	let runAgainCommand = vscode.commands.registerCommand('extension.runAgain', runAgain)
	context.subscriptions.push(runAgainCommand)

	let runCurrentCommand = vscode.commands.registerCommand('extension.runAgain', runCurrent)
	context.subscriptions.push(runCurrentCommand)
}
exports.activate = activate

function runAll() {
	executeCommand(buildCommand(`bundle exec rspec ${getFilePath()}`))
}

function runAgain() {
	if (lastCommand) {
		executeCommand(lastCommand)
	} else {
		vscode.window.showInformationMessage('rspec-iterm: No previous command found')
	}
}

function runCurrent() {
	let line = vscode.window.activeTextEditor.selection.active.line
	executeCommand(buildCommand(`bundle exec rspec ${getFilePath()}:${line}`))
}

// Try to return relative file path, fallback to full qualified.
function getFilePath() {
	const resource = vscode.window.activeTextEditor.document.uri
	const workspace = vscode.workspace

	if (resource.scheme === 'file') {
		const folder = workspace.getWorkspaceFolder(resource)
		if (!folder) {
			return resource.fsPath
		} else {
			return resource.fsPath.replace(folder.uri.fsPath + '/', '')
		}
	}
}

function buildCommand(code) {
	let activate = ''
	if (vscode.workspace.getConfiguration('rspec-iterm').get('runInForeground')) {
		activate = ` -e 'activate current session' `
	}
	const command = `osascript \
		-e 'tell application "iTerm2"' \
		-e 'tell current session of first window' \
		${activate} \
		-e 'write text "${code}"' \
		-e 'end tell' \
		-e 'end tell' \
	`
	lastCommand = command
	return command
}

function executeCommand(command) {
	exec(command)
}
