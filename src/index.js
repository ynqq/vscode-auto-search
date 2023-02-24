// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { window, commands, env, Position } = require("vscode");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function getSelectedText() {
  const { selection, document } = window.activeTextEditor;
  return Promise.resolve(document.getText(selection).trim());
}

/**
 * @param  context
 */
function activate(context) {
  context.subscriptions.push(
    commands.registerCommand("autoSearch.search", handleSearch)
  );
}

// This method is called when your extension is deactivated
function deactivate() {}

const next = (time = 2000) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });

/**
 * Get the relative paths of the current search results
 * for the next `runInSearchPanel` call
 *
 * @returns array of paths or undefined
 */
async function getSearchResultsFiles(allKey) {
  await commands.executeCommand("search.action.copyAll");
  let results = await env.clipboard.readText();
  if (results) {
    return undefined;
  } else {
    return {
      key: allKey,
    };
  }
}

const searchCommond = async (selectText) => {
  await commands.executeCommand(
    "workbench.action.findInFiles",
    {
      query: selectText,
      triggerSearch: true,
      isCaseSensitive: true,
      matchWholeWord: true,
      preserveCase: true,
      excludeSettingAndIgnoreFiles: true,
      showIncludesExcludes: true,
    },
    true
  );
};

const searchAction = async (data, prevKey = "") => {
  const result = [], keepData = {}, deleteData = {}

  for (let i in data) {
    if (typeof data[i] === "object") {
      const res = await searchAction(data[i], i);
      result.push(...res.deleteList);
	  keepData[i] = res.keepData
	  deleteData[i] = res.deleteData
    } else if (typeof data[i] === "string") {
      const allKey = prevKey + "." + i;
      await searchCommond(allKey);
      await next();
      const res = await getSearchResultsFiles(allKey);
      if (res) {
        result.push(res);
		deleteData[i] = data[i]
      }else{
		keepData[i] = data[i]
	  }
    }
  }
  return {
	deleteList: result,
	keepData: keepData,
	deleteData
  };
};

async function handleSearch() {
  const selectText = await getSelectedText();
  const data = JSON.parse(selectText);
  const result = await searchAction(data);
  console.log(result);
  window.activeTextEditor.edit((edit) => {
    edit.insert(new Position(0, 0), JSON.stringify(result));
  });
}

module.exports = {
  activate,
  deactivate,
};

