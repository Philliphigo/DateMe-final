// assets/js/auth.js - Authentication Logic
(() => {
  "use strict";

  const safeQuery = (sel, ctx = document) => {
    try {
      return ctx.querySelector(sel);
    } catch (e) {
      return null;
    }
  };

  function bindAuthForms() {
    const loginForm = safeQuery("#login-form");
    const signupForm = safeQuery("#signup-form");

    if (loginForm) {
      loginForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        // In a real app, you would validate credentials here.
        // For this demo, we'll assume the login is successful.
        console.log("Logging in...");
        localStorage.setItem("dateme-is-logged-in", "true");
        window.location.href = 'index.html'; // Redirect to the main app
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        // In a real app, you would create a new user account here.
        // For this demo, we'll assume the signup is successful.
        console.log("Signing up...");
        localStorage.setItem("dateme-is-logged-in", "true");
        window.location.href = 'index.html'; // Redirect to the main app
      });
    }
  }

  // Bind the forms only when the DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    // We only want to run this code on the login/signup pages
    if (document.body.classList.contains('login-page') || document.body.classList.contains('signup-page')) {
      bindAuthForms();
    }
  });

})();
