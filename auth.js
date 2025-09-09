// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7nZ2Y51lfpkrwHKIvYe-y_EmyIk_WEfU",
  authDomain: "dateme-website.firebaseapp.com",
  projectId: "dateme-website",
  storageBucket: "dateme-website.firebasestorage.app",
  messagingSenderId: "589523570810",
  appId: "1:589523570810:web:b0e7f6520242704ebdebc3",
  measurementId: "G-PXGQT73TXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get form and link elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const loginLink = document.getElementById('loginLink');
const signupLink = document.getElementById('signupLink');
const formHeading = document.getElementById('form-heading');

// Toggle between signup and login forms
loginLink.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    formHeading.innerHTML = 'Welcome Back';
});

signupLink.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    formHeading.innerHTML = 'Welcome to<br><span class="logo">DateMe</span>';
});

// Handle Signup
const signupFormElement = document.getElementById('signup-form');
signupFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up successfully
            const user = userCredential.user;
            console.log("User created:", user);
            alert("Signup successful!");
            // You can redirect to another page here, e.g., window.location.href = "dashboard.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Signup error:", errorCode, errorMessage);
            alert(`Signup failed: ${errorMessage}`);
        });
});

// Handle Login
const loginFormElement = document.getElementById('login-form');
loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Logged in successfully
            const user = userCredential.user;
            console.log("User logged in:", user);
            alert("Login successful!");
            // You can redirect to another page here, e.g., window.location.href = "dashboard.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login error:", errorCode, errorMessage);
            alert(`Login failed: ${errorMessage}`);
        });
});
