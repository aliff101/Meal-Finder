// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveMealIngredient: (data) => ipcRenderer.invoke('save-meal-ingredient', data),
  readRecipes: () => ipcRenderer.invoke('read-recipes'),
  deleteRecipe: (name) => ipcRenderer.invoke('delete-recipe', name),
  updateRecipe: (data) => ipcRenderer.invoke('update-recipe', data)
});




