function addSearchBox() {
  const container = document.querySelector('.container');
  const recipesContainer = document.getElementById('recipesContainer');
  
  const searchBox = document.createElement('div');
  searchBox.className = 'recipe-search';
  searchBox.innerHTML = `
    <div class="search-container">
      <input 
        type="text" 
        id="recipeSearch" 
        placeholder="Search for a meal..."
      >
      <button onclick="searchMealRecipe()">Search</button>
    </div>
    <div id="searchResult" class="search-result"></div>
  `;
  
  container.insertBefore(searchBox, recipesContainer);
}

async function searchMealRecipe() {
  const searchTerm = document.getElementById('recipeSearch').value.trim();
  const searchResult = document.getElementById('searchResult');
  
  if (!searchTerm) {
    searchResult.innerHTML = '<p>Please enter a meal name to search.</p>';
    return;
  }

  try {
    const recipe = await window.electronAPI.searchRecipe(searchTerm);
    
    if (recipe) {
      searchResult.innerHTML = `
        <div class="recipe-card">
          <h3>${recipe.name}</h3>
          <div class="recipe-ingredients">
            <h4>Ingredients:</h4>
            <ul>
              ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    } else {
      searchResult.innerHTML = '<p>No matching recipe found.</p>';
    }
  } catch (error) {
    console.error('Error searching recipe:', error);
    searchResult.innerHTML = `<p>Error searching recipe: ${error.message}</p>`;
  }
}

async function loadRecipes() {
  try {
    console.log('Starting to load recipes...');
    const recipes = await window.electronAPI.readRecipes();
    console.log('Received recipes:', recipes);
    
    const container = document.getElementById('recipesContainer');
    if (!container) {
      console.error('Container not found!');
      return;
    }
    
    container.innerHTML = '';

    if (!recipes || recipes.length === 0) {
      container.innerHTML = '<p>No recipes found. Add some recipes first!</p>';
      return;
    }

    recipes.forEach(recipe => {
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.setAttribute('data-recipe', recipe.name);
      
      const safeIngredients = JSON.stringify(recipe.ingredients)
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
      
      recipeCard.innerHTML = `
        <div class="recipe-header">
          <h3>${recipe.name}</h3>
          <div class="recipe-actions">
            <button type="button" class="btn-edit" onclick="editRecipe('${recipe.name.replace(/'/g, "\\'")}', ${safeIngredients})">
              <span>✏️</span>
            </button>
            <button type="button" class="btn-delete" onclick="deleteRecipe('${recipe.name.replace(/'/g, "\\'")}')">
              <span>🗑️</span>
            </button>
          </div>
        </div>
        <div class="recipe-ingredients">
          <h4>Ingredients:</h4>
          <ul>
            ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
          </ul>
        </div>
      `;
      
      container.appendChild(recipeCard);
    });
  } catch (error) {
    console.error('Error loading recipes:', error);
    const container = document.getElementById('recipesContainer');
    container.innerHTML = `<p>Error loading recipes: ${error.message}</p>`;
  }
}

async function deleteRecipe(name) {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    try {
      await window.electronAPI.deleteRecipe(name);
      loadRecipes(); // Reload the recipes list
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe: ' + error.message);
    }
  }
}

function editRecipe(name, ingredients) {
  try {
    console.log('Editing recipe:', name, ingredients); // Debug log
    
    const container = document.getElementById('recipesContainer');
    const recipeCard = document.querySelector(`[data-recipe="${name}"]`);
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'recipe-card edit-mode';
    editForm.setAttribute('data-recipe', name);
    
    // Convert ingredients to array if it's a string
    const ingredientsList = Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients);
    
    editForm.innerHTML = `
      <h3>Edit Recipe: ${name}</h3>
      <div class="edit-form">
        <div class="ingredients-list">
          ${ingredientsList.map(ingredient => `
            <div class="ingredient-input">
              <input type="text" value="${ingredient.replace(/"/g, '&quot;')}" class="edit-ingredient">
              <button type="button" class="btn-remove" onclick="removeIngredient(this)">-</button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn-add" onclick="addIngredient(this)">Add Ingredient</button>
        <div class="edit-actions">
          <button type="button" class="btn-save" onclick="saveRecipe('${name.replace(/'/g, "\\'")}')">Save</button>
          <button type="button" class="btn-cancel" onclick="loadRecipes()">Cancel</button>
        </div>
      </div>
    `;
    
    if (recipeCard) {
      recipeCard.replaceWith(editForm);
    } else {
      container.insertBefore(editForm, container.firstChild);
    }
  } catch (error) {
    console.error('Error in editRecipe:', error);
    alert('Error setting up edit mode: ' + error.message);
  }
}

function addIngredient(button) {
  const ingredientsList = button.previousElementSibling;
  const newIngredient = document.createElement('div');
  newIngredient.className = 'ingredient-input';
  newIngredient.innerHTML = `
    <input type="text" class="edit-ingredient" placeholder="Enter ingredient">
    <button type="button" class="btn-remove" onclick="removeIngredient(this)">-</button>
  `;
  ingredientsList.appendChild(newIngredient);
}

function removeIngredient(button) {
  button.parentElement.remove();
}

async function saveRecipe(name) {
  try {
    console.log('Saving recipe:', name); // Debug log
    
    // Get all ingredient inputs from the edit form
    const ingredients = Array.from(
      document.querySelectorAll('.edit-mode .edit-ingredient')
    )
      .map(input => input.value.trim())
      .filter(value => value !== '');

    console.log('Ingredients to save:', ingredients); // Debug log

    // Send update request
    await window.electronAPI.updateRecipe({
      name: name,
      ingredients: ingredients
    });

    // Reload the recipes list
    await loadRecipes();
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Error saving recipe: ' + error.message);
  }
}

// Load recipes when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, calling loadRecipes()');
  loadRecipes();
}); 