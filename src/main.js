const apiUrl = 'https://www.themealdb.com/api/json/v1/1/';

// Fetch meals based on ingredient and category
async function searchMeal() {
  const ingredient = document.getElementById('ingredient').value;
  const category = document.getElementById('category').value;

  let url = `${apiUrl}/filter.php?`;
  if (ingredient) url += `i=${ingredient}`;
  if (category) url += `&c=${category}`;

  const response = await fetch(url);
  const data = await response.json();

  const mealList = document.getElementById('mealList');
  mealList.innerHTML = '';

  if (data.meals) {
    data.meals.forEach(meal => {
      const mealItem = document.createElement('div');
      mealItem.classList.add('meal-item');
      mealItem.innerHTML = 
        `<img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h3>${meal.strMeal}</h3>`;
      mealItem.onclick = () => displayMeal(meal.idMeal);
      mealList.appendChild(mealItem);
    });
  } else {
    mealList.innerHTML = '<p>No meals found.</p>';
  }
}

// Display selected meal information in modal
async function displayMeal(mealId) {
  const response = await fetch(`${apiUrl}/lookup.php?i=${mealId}`);
  const data = await response.json();
  const meal = data.meals[0];

  document.getElementById('mealInfo').innerHTML = 
    `<h2>${meal.strMeal}</h2>
    <p>Category: ${meal.strCategory}</p>
    <p>Area: ${meal.strArea}</p>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <h3>Ingredients:</h3>
    <ul>${getIngredients(meal).map(ingredient => `<li>${ingredient}</li>`).join('')}</ul>
    <h3>Instructions:</h3>
    <p>${meal.strInstructions}</p>
    <a href="${meal.strYoutube}" target="_blank">Watch on YouTube</a>`;

  // Show the modal
  document.getElementById('mealModal').style.display = "block";
}

// Function to add meal to planner from the modal
function addToPlanner(mealName) {
  const plannerList = document.getElementById('plannerList');
  addItem(plannerList, 'mealPlanner', mealName);
  alert(`${mealName} has been added to your meal planner!`);
}

// Close the modal
function closeModal() {
  document.getElementById('mealModal').style.display = "none";
}

// Get a list of ingredients and measurements
function getIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient) ingredients.push(`${ingredient} - ${measure}`);
  }
  return ingredients;
}

// Close modal when clicking outside of the modal content
window.onclick = function(event) {
  const modal = document.getElementById('mealModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Add these new functions
function addIngredientInput() {
    const ingredientInputs = document.getElementById('ingredientInputs');
    const newRow = document.createElement('div');
    newRow.className = 'ingredient-row';
    newRow.innerHTML = `
        <input type="text" class="groceryItem" placeholder="Enter ingredient" required>
        <button type="button" class="remove-ingredient" onclick="removeIngredientInput(this)">-</button>
    `;
    ingredientInputs.appendChild(newRow);
}

function removeIngredientInput(button) {
    button.parentElement.remove();
}

// Update the form submit handler
document.getElementById('groceryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const mealName = document.getElementById('mealName').value;
    const ingredientInputs = document.querySelectorAll('.groceryItem');
    
    try {
        // Store ingredients temporarily for display
        const ingredients = [];
        
        // Save each ingredient
        for (const input of ingredientInputs) {
            const ingredient = input.value;
            if (ingredient.trim()) {
                await window.electronAPI.saveMealIngredient({ mealName, ingredient });
                ingredients.push(ingredient); // Store for display
            }
        }

        // Update the displayed list
        const groceryList = document.getElementById('groceryList');
        const li = document.createElement('li');
        li.textContent = `${mealName}:`;
        const ul = document.createElement('ul');
        ingredients.forEach(ingredient => {
            const subLi = document.createElement('li');
            subLi.textContent = ingredient;
            ul.appendChild(subLi);
        });
        li.appendChild(ul);
        groceryList.appendChild(li);

        // Clear the form
        document.getElementById('mealName').value = '';
        const ingredientInputsDiv = document.getElementById('ingredientInputs');
        ingredientInputsDiv.innerHTML = `
            <div class="ingredient-row">
                <input type="text" class="groceryItem" placeholder="Enter ingredient" required>
                <button type="button" class="remove-ingredient" onclick="removeIngredientInput(this)">-</button>
            </div>
        `;

    } catch (error) {
        alert('Error saving ingredients: ' + error.message);
    }
});




