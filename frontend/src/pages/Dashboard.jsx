import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { mealService, nutritionService } from '../services';
import { format } from 'date-fns';

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [nutritionLog, setNutritionLog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMeals();
    fetchNutritionLog();
  }, [selectedDate]);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await mealService.getMealsByDate(dateStr);
      setMeals(response.meals || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNutritionLog = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await nutritionService.getNutritionLog(dateStr);
      setNutritionLog(response.nutritionLog);
    } catch (error) {
      console.error('Error fetching nutrition log:', error);
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.totalNutrition?.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.totalNutrition?.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.totalNutrition?.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.totalNutrition?.fat || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Diet Dashboard</h1>
          <div className="text-gray-600">Welcome, {user?.name}</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Nutrition Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Calories</h3>
            <p className="text-3xl font-bold text-blue-500">{totalCalories}</p>
            <p className="text-gray-500 text-xs mt-1">kcal</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Protein</h3>
            <p className="text-3xl font-bold text-green-500">{totalProtein.toFixed(1)}</p>
            <p className="text-gray-500 text-xs mt-1">g</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Carbs</h3>
            <p className="text-3xl font-bold text-yellow-500">{totalCarbs.toFixed(1)}</p>
            <p className="text-gray-500 text-xs mt-1">g</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Fat</h3>
            <p className="text-3xl font-bold text-red-500">{totalFat.toFixed(1)}</p>
            <p className="text-gray-500 text-xs mt-1">g</p>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Meals</h2>
          {loading ? (
            <p className="text-gray-500">Loading meals...</p>
          ) : meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div key={meal._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-800 capitalize">{meal.mealType}</h3>
                  <p className="text-sm text-gray-600">{meal.items.length} items</p>
                  <p className="text-sm text-blue-600 font-semibold">{meal.totalNutrition.calories} kcal</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No meals logged for this date</p>
          )}
        </div>
      </div>
    </div>
  );
}
