const { app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Update the path to be relative to the application
const recipePath = path.join(__dirname, 'Recipe');

// Register IPC handlers BEFORE app is ready
ipcMain.handle('read-recipes', async () => {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(recipePath)) {
      fs.mkdirSync(recipePath, { recursive: true });
    }

    // Read all files in the directory
    const files = fs.readdirSync(recipePath);
    const recipes = [];
    
    for (const file of files) {
      const filePath = path.join(recipePath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      recipes.push({
        name: path.parse(file).name,
        ingredients: content.split('\n').filter(line => line.trim())
      });
    }
    
    console.log('Found recipes:', recipes);
    return recipes;
  } catch (error) {
    console.error('Error reading recipes:', error);
    throw error;
  }
});

ipcMain.handle('save-meal-ingredient', async (event, data) => {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(recipePath)) {
      fs.mkdirSync(recipePath, { recursive: true });
    }

    const filePath = path.join(recipePath, `${data.mealName}.txt`);
    
    // Append the ingredient to the file
    fs.appendFileSync(filePath, `${data.ingredient}\n`, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving ingredient:', error);
    throw error;
  }
});

ipcMain.handle('delete-recipe', async (event, recipeName) => {
  try {
    const filePath = path.join(recipePath, `${recipeName}.txt`);
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
});

ipcMain.handle('update-recipe', async (event, data) => {
  try {
    console.log('Updating recipe:', data); // Debug log
    const filePath = path.join(recipePath, `${data.name}.txt`);
    
    // Write the new ingredients, overwriting the existing file
    fs.writeFileSync(filePath, data.ingredients.join('\n'), 'utf8');
    console.log('Recipe updated successfully'); // Debug log
    return { success: true };
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
});

ipcMain.handle('search-recipe', async (event, mealName) => {
  try {
    const files = fs.readdirSync(recipePath);
    const matchingRecipes = files.filter(file => 
      path.parse(file).name.toLowerCase().includes(mealName.toLowerCase())
    );
    
    if (matchingRecipes.length === 0) {
      return null;
    }

    const recipe = {
      name: path.parse(matchingRecipes[0]).name,
      ingredients: fs.readFileSync(
        path.join(recipePath, matchingRecipes[0]), 
        'utf8'
      ).split('\n').filter(line => line.trim())
    };
    
    return recipe;
  } catch (error) {
    console.error('Error searching recipe:', error);
    throw error;
  }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
