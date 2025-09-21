import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, setLogLevel } from 'firebase/firestore';

// App ID and Firebase Config are injected variables from the environment
// We sanitize the app ID to ensure it is a valid Firestore document ID (no slashes or invalid chars)
const appId = typeof __app_id !== 'undefined' ? __app_id.replace(/[^a-zA-Z0-9_-]/g, '_') : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [habits, setHabits] = useState([]);
  const [habitName, setHabitName] = useState('');
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = '';
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = '';
  
  // Custom Hook to manage the modal state
  const showCustomModal = (type, title, message) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };
  
  const hideCustomModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        setLogLevel('debug');
        console.log('Sanitized appId:', appId); // Log the sanitized ID for debugging
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (token) {
          await signInWithCustomToken(firebaseAuth, token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
        
        // After successful sign-in, set the user ID and auth readiness state
        const userId = firebaseAuth.currentUser?.uid || crypto.randomUUID();
        setUserId(userId);
        setIsAuthReady(true);
        console.log("Authentication successful, userId:", userId);

      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (isAuthReady && db && userId) {
      const habitsCollectionRef = collection(db, "artifacts", appId, "users", userId, "habits");
      const unsubscribe = onSnapshot(habitsCollectionRef, (querySnapshot) => {
        const habitsData = [];
        querySnapshot.forEach((doc) => {
          habitsData.push({ id: doc.id, ...doc.data() });
        });
        setHabits(habitsData);
      }, (error) => {
        console.error("Error listening to habits collection:", error);
      });
      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady]);

  const addOrUpdateHabit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) {
      showCustomModal('error', 'Error', 'Habit name cannot be empty.');
      return;
    }

    if (!db || !userId) {
      showCustomModal('error', 'Error', 'Database not ready. Please try again.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      if (editingHabitId) {
        // Update habit
        const habitDocRef = doc(db, "artifacts", appId, "users", userId, "habits", editingHabitId);
        await updateDoc(habitDocRef, {
          name: habitName,
          lastUpdated: today
        });
        setEditingHabitId(null);
        showCustomModal('success', 'Success', 'Habit updated successfully!');
      } else {
        // Add new habit
        await addDoc(collection(db, "artifacts", appId, "users", userId, "habits"), {
          name: habitName,
          streak: 0,
          completed: false,
          lastCompleted: null,
          createdAt: new Date().toISOString()
        });
        showCustomModal('success', 'Success', 'Habit added successfully!');
      }
      setHabitName('');
    } catch (e) {
      showCustomModal('error', 'Error', 'Failed to add/update habit. Please try again.');
      console.error("Error adding/updating document: ", e);
    }
  };

  const deleteHabit = async (id) => {
    if (!db || !userId) {
      showCustomModal('error', 'Error', 'Database not ready. Please try again.');
      return;
    }
    try {
      await deleteDoc(doc(db, "artifacts", appId, "users", userId, "habits", id));
      showCustomModal('success', 'Success', 'Habit deleted successfully!');
    } catch (e) {
      showCustomModal('error', 'Error', 'Failed to delete habit. Please try again.');
      console.error("Error deleting document: ", e);
    }
  };

  const editHabit = (habit) => {
    setHabitName(habit.name);
    setEditingHabitId(habit.id);
  };

  const toggleComplete = async (habit) => {
    if (!db || !userId) {
      showCustomModal('error', 'Error', 'Database not ready. Please try again.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const habitDocRef = doc(db, "artifacts", appId, "users", userId, "habits", habit.id);
    let newStreak = habit.streak;

    if (habit.completed && habit.lastCompleted === today) {
      // Un-completing the habit for today
      await updateDoc(habitDocRef, {
        completed: false,
        lastCompleted: null,
        streak: newStreak
      });
    } else {
      // Completing the habit for today
      if (habit.lastCompleted !== today) {
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
        if (habit.lastCompleted === yesterday) {
          newStreak = habit.streak + 1;
        } else {
          newStreak = 1;
        }
      }
      await updateDoc(habitDocRef, {
        completed: true,
        lastCompleted: today,
        streak: newStreak
      });
    }
  };

  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const totalCompleted = habits.filter(h => h.completed).length;

  // Modal Component
  const Modal = ({ type, title, message, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="relative p-8 bg-white w-96 max-w-sm rounded-lg shadow-xl transform transition-all">
          <div className={`p-4 rounded-full w-16 h-16 mx-auto -mt-12 mb-4 flex items-center justify-center text-white ${bgColor}`}>
            {type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-center text-gray-600 mb-4">{message}</p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`py-2 px-6 rounded-full text-white font-semibold transition-colors duration-300 ${bgColor} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans antialiased text-gray-800">
      {showModal && <Modal type={modalType} title={modalTitle} message={modalMessage} onClose={hideCustomModal} />}
      <div className="container mx-auto max-w-4xl p-6 bg-white rounded-3xl shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-6">
          <span className="text-indigo-600">Smart</span>-Streak
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Your daily companion for building better habits.
        </p>

        {/* Dashboard Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8">
          <div className="bg-indigo-100 p-6 rounded-xl shadow-md transform transition-transform duration-300 hover:scale-105">
            <h3 className="text-4xl font-bold text-indigo-600 mb-2">{habits.length}</h3>
            <p className="text-sm text-indigo-800">Total Habits</p>
          </div>
          <div className="bg-green-100 p-6 rounded-xl shadow-md transform transition-transform duration-300 hover:scale-105">
            <h3 className="text-4xl font-bold text-green-600 mb-2">{totalCompleted}</h3>
            <p className="text-sm text-green-800">Completed Today</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-xl shadow-md transform transition-transform duration-300 hover:scale-105">
            <h3 className="text-4xl font-bold text-yellow-600 mb-2">{longestStreak}</h3>
            <p className="text-sm text-yellow-800">Longest Streak</p>
          </div>
        </div>

        {/* Habit Form */}
        <form onSubmit={addOrUpdateHabit} className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Add a new habit..."
            className="flex-grow p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors duration-300"
          />
          <button
            type="submit"
            className="p-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            {editingHabitId ? 'Update Habit' : 'Add Habit'}
          </button>
        </form>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between bg-white p-4 rounded-xl shadow-md border-l-4 border-indigo-500 transition-all duration-300 transform hover:scale-100"
              >
                <div className="flex-1">
                  <span className="block text-xl font-semibold">{habit.name}</span>
                  <span className="text-sm text-gray-500">
                    Current Streak: <span className="font-bold text-indigo-600">{habit.streak} days</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleComplete(habit)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors duration-300 ${habit.completed ? 'bg-green-500' : 'bg-gray-400'}`}
                    aria-label="Complete habit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => editHabit(habit)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500 text-white hover:bg-yellow-600 transition-colors duration-300"
                    aria-label="Edit habit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors duration-300"
                    aria-label="Delete habit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 p-8 rounded-xl border-2 border-dashed border-gray-300">
              No habits found. Start by adding one above!
            </div>
          )}
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          User ID: <span className="font-mono text-xs">{userId}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
