import * as vscode from "vscode";
import { DirectoryProvider } from "./provider/DirectoryProvider";
import { DirectoryWorker } from "./operator/DirectoryWorker";
import { DirectoryProviderCommands } from "./commands/CrudCommands";
import { vsCodeCommands } from "./commands/CrudCommands";

export function activate(context: vscode.ExtensionContext)
{
  const directoryOperator = new DirectoryWorker(
    context,
    vscode.workspace.workspaceFolders
  );

  const directoryProvider = new DirectoryProvider(
    directoryOperator
  );

  function debounce(fn: Function, delay: number) {
    let timer: NodeJS.Timeout;
    return function(this: any, ...args: any[]) {
      if (timer) { clearTimeout(timer); }
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const filesChangeEvent = debounce(() => {
    vscode.commands.executeCommand(DirectoryProviderCommands.RefreshEntry);
  }, 300);

  const watcher = vscode.workspace.createFileSystemWatcher('**', false, true, false);

  context.subscriptions.push(
    ...[
      vscode.window.registerTreeDataProvider(
        "explorer-bookmark",
      directoryProvider),
      watcher,
      watcher.onDidCreate(filesChangeEvent),
      watcher.onDidDelete(filesChangeEvent),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.RefreshEntry,
        () => directoryProvider.refresh()
      ),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.OpenItem,
        (file) =>
        {
          vscode.commands.executeCommand(
            vsCodeCommands.Open,
            vscode.Uri.parse(file.resourceUri.path)
          );
        }
      ),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.SelectItem,
        (args) => directoryProvider.selectItem(vscode.Uri.parse(args.path))
      ),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.RemoveItem,
        (args) =>
        {
          directoryProvider.removeItem(args.resourceUri);
        }
      ),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.CantRemoveItem,
        () =>
        {
          vscode.window.showInformationMessage(
            "You can only remove items that were directly added to the view"
          );
        }
      ),
      vscode.commands.registerCommand(
        DirectoryProviderCommands.RemoveAllItems,
        () => directoryProvider.removeAllItems()
      ),
    ]
  );
}

export function deactivate() { }
