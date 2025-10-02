// app.js — DateWise interactive logic (Refactored to match provided HTML)
(() => {
	"use strict";

	/* ====================================================================
	 * 1. FIREBASE & MOCK CONFIGURATION (Preserved)
	 * ==================================================================== */
	const firebaseConfig = {
		apiKey: "AIzaSyA7nZ2Y51lfpkrwHKIvYe-y_EmyIk_WEfU",
		authDomain: "dateme-website.firebaseapp.com",
		projectId: "dateme-website",
		storageBucket: "dateme-website.firebasestorage.app",
		messagingSenderId: "589523570810",
		appId: "1:589523570810:web:b0e7f6520242704ebdebc3",
	};

	const MockFirebase = {
		initializeApp: () => ({}),
		auth: () => ({
			onAuthStateChanged: (callback) => console.log("Auth Mock: Listening..."),
			signOut: async () => console.log("Auth Mock: Signed out."),
			createUserWithEmailAndPassword: async () => ({ user: { sendEmailVerification: async () => {} } }),
			signInWithEmailAndPassword: async () => {},
		}),
		firestore: () => ({
			collection: () => ({
				doc: () => ({ set: async () => {}, get: async () => ({}), update: async () => {} }),
				get: async () => ({ docs: [] }),
			}),
			FieldValue: { serverTimestamp: () => new Date() },
		}),
		storage: () => ({
			ref: () => ({ put: async () => ({ ref: { getDownloadURL: async () => "https://placehold.co/240x240" } }) }),
		}),
	};

	const firebase = window.firebase || MockFirebase;
	firebase.initializeApp(firebaseConfig);
	const auth = firebase.auth();
	const db = firebase.firestore();
	const storage = firebase.storage();

	/* =========================
	 * 2. APP STATE & CACHE
	 * ========================= */
	const App = {
		// DOM Helpers
		$: (selector) => document.querySelector(selector),
		$$: (selector) => Array.from(document.querySelectorAll(selector)),
		// State
		currentUser: {
			uid: "temp-user-id-123",
			name: "Phillip",
			email: "phil@example.com",
			onboardingComplete: true,
			isSubscriber: false,
			age: 20,
			gender: "male",
			bio: "Friendly and focused. Building a modern dating site with clean design and smooth UX.",
			location: { city: "Lilongwe", lat: -13.9667, lon: 33.7833 },
			interests: ["Tech", "Design", "Entrepreneurship"],
			avatar: "IMG_1078.jpeg",
			photos: ["IMG_0063.jpeg", "IMG_0064.jpeg", "IMG_0139.jpeg"], // Matched HTML photo names
			settings: {
				maxDistance: 50,
				ageRange: [18, 30],
				hideAccount: false,
				showGender: "female", // Added based on HTML radio group
			},
		},
		allProfiles: [
			{ uid: "temp-profile-1", name: "Jane", age: 22, bio: "Loves to read and hike.", onboardingComplete: true, location: { city: "Blantyre" }, avatar: "https://placehold.co/120x120?text=Jane", distance: 12, isOnline: true },
			{ uid: "temp-profile-2", name: "John", age: 25, bio: "Musician and artist.", onboardingComplete: true, location: { city: "Lilongwe" }, avatar: "https://placehold.co/120x120?text=John", distance: 3, isOnline: false },
			{ uid: "temp-profile-3", name: "Sarah", age: 21, bio: "Student and coffee addict.", onboardingComplete: true, location: { city: "Zomba" }, avatar: "https://placehold.co/120x120?text=Sarah", distance: 80, isOnline: true },
		],
		currentMatchId: null,
		pendingChanges: null,
		PAGE_HISTORY: ["landing"], // Changed default to 'landing' based on HTML script
		// Swiping State
		isDragging: false,
		startX: 0,
		startY: 0,
		currentCard: null,
		SWIPE_THRESHOLD: 100,
		ROTATION_FACTOR: 0.2,
		// Cached DOM Elements
		body: document.body,
		pages: null,
		pageMap: {},
		mainHeader: null,
		pageHeader: null,
		bottomNav: null,
	};

	/* =========================
	 * 3. HELPER UTILITIES (Preserved)
	 * ========================= */
	const safeQuery = (sel, ctx = document) => {
		try {
			return ctx.querySelector(sel);
		} catch (e) {
			console.warn(`Query failed for ${sel}:`, e);
			return null;
		}
	};

	const escapeHtml = (unsafe) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

	const debounce = (func, delay) => {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), delay);
		};
	};

	/* =========================
	 * 4. ROUTING & UI STATE
	 * ========================= */
	function updateHeader(routeName) {
		if (!App.mainHeader || !App.pageHeader || !App.bottomNav) return;

		const isAuthPage = ["signup", "login", "onboarding", "landing"].includes(routeName);
		const isMainRoute = ["discover", "matches", "connect", "messages", "profile"].includes(routeName);

		App.mainHeader.hidden = isAuthPage; // Show main nav on auth/landing
		App.pageHeader.hidden = isAuthPage || isMainRoute; // Hide page header on main/auth pages
		App.bottomNav.hidden = isAuthPage; // Hide bottom nav on auth/landing

		// Update page title for non-main routes
		if (!App.pageHeader.hidden) {
			const titleElement = safeQuery(".page-title", App.pageHeader);
			if (titleElement) {
				const titleText = routeName
					.replace(/-/g, " ")
					.split(" ")
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");
				titleElement.textContent = titleText.replace("Page ", ""); // Clean up titles like "Page Discover"
			}
		}

		App.$$(".bottom-nav__link").forEach((link) => {
			link.classList.toggle("is-active", link.getAttribute("data-route-link") === routeName);
		});

		if (App.hamburgerMenu && App.hamburgerMenuBtn) {
			// Hamburger menu is handled by the script in HTML, but ensure it's hidden on route change
			App.hamburgerMenu.setAttribute('hidden', ''); 
			App.hamburgerMenuBtn.setAttribute("aria-expanded", "false");
		}
	}

	function routeTo(routeName = "landing", push = true) {
		if (["login", "signup", "onboarding", "landing"].includes(routeName)) {
			App.body.classList.add("auth-page");
		} else {
			App.body.classList.remove("auth-page");
		}

		App.pages.forEach((p) => {
			p.classList.remove("is-visible");
			p.hidden = true;
		});

		const currentPage = App.pageMap[routeName] || App.pageMap["landing"]; // Default to landing
		if (currentPage) {
			currentPage.classList.add("is-visible");
			currentPage.hidden = false;
		}

		updateHeader(routeName);

		if (push) {
			history.pushState({ route: routeName }, "", `#${routeName}`);
			if (App.PAGE_HISTORY[App.PAGE_HISTORY.length - 1] !== routeName) {
				App.PAGE_HISTORY.push(routeName);
			}
		}

		// *** FIX: Run necessary load/render functions on route change ***
		if (routeName === "profile-edit") loadProfileForEdit();
		if (routeName === "profile") renderProfilePage(App.currentUser);
		if (routeName === "discover-settings") loadDiscoverySettings();
		if (routeName === "messages") {
			// Placeholder for renderConvoList
		}
	}

	function goBack() {
		App.body.classList.add("slide-back");
		setTimeout(() => App.body.classList.remove("slide-back"), 300);

		if (App.PAGE_HISTORY.length > 1) {
			App.PAGE_HISTORY.pop();
			const previousRoute = App.PAGE_HISTORY[App.PAGE_HISTORY.length - 1];
			routeTo(previousRoute, false);
		} else {
			routeTo("landing", false);
		}
	}

	function bindRouting() {
		document.addEventListener("click", (ev) => {
			const link = ev.target.closest("[data-route-link]");
			if (!link) return;
			ev.preventDefault();

			let route = link.getAttribute("data-route-link");
			if (!route) return;
			
			// Handle special links like 'discover-settings' from the main header button
			if (route === "discover-settings") {
				routeTo(route, true);
				return;
			}
			
			// Route mapping based on HTML structure
			switch (route) {
				case "support":
					route = "support";
					break;
				case "subscription-plans":
				case "payments":
					route = "donate";
					break;
				case "manage-photos":
				case "edit-profile":
					route = "profile-edit";
					break;
			}

			const targetUid = link.getAttribute("data-target-uid");
			if (route === "messages" && targetUid) {
				App.currentMatchId = targetUid;
			}

			routeTo(route, true);
		});

		window.addEventListener("popstate", (e) => {
			const route = e.state?.route || "landing";
			routeTo(route, false);
		});

		// Bind back buttons
		App.backButtons = App.$$('[data-action="back"]'); // Re-query just in case
		App.backButtons.forEach((btn) => btn.addEventListener("click", goBack));
	}

	/* =======================================
	 * 5. AUTHENTICATION & PROFILE DATA
	 * ======================================= */
	async function handleUserLogin(userProfile) {
		App.currentUser = userProfile;
		App.body.classList.add("logged-in");

		// *** FIX: Ensure initial profile render happens ***
		renderProfilePage(App.currentUser);
		// *** FIX: Load discovery data ***
		await fetchAllProfiles();
		await loadNextProfile();

		routeTo("discover", false); // Start on discover page after login
	}

	async function saveUserProfile(profileData) {
		console.log("Profile data saved (simulated):", profileData);
		App.currentUser = { ...App.currentUser, ...profileData };
	}

	function bindAuthForms() {
		if (App.signupForm) {
			App.signupForm.addEventListener("submit", async (e) => {
				e.preventDefault();
				const email = App.signupForm.querySelector("#signup-email")?.value;
				const password = App.signupForm.querySelector("#signup-password")?.value;
				if (!email || !password) {
					alert("Please fill in all fields.");
					return;
				}
				alert("Account created (Mocked)! Please check your email.");
				routeTo("login", true);
			});
		}

		// The HTML doesn't have an explicit onboarding form, so we use the login form logic for "successful" login
		if (App.loginForm) {
			App.loginForm.addEventListener("submit", async (e) => {
				e.preventDefault();
				const email = App.loginForm.querySelector("#login-email")?.value;
				const password = App.loginForm.querySelector("#login-password")?.value;
				if (!email || !password) {
					alert("Please fill in all fields.");
					return;
				}
				await handleUserLogin(App.currentUser);
			});
		}

		if (App.logoutBtn) {
			App.logoutBtn.addEventListener("click", async () => {
				try {
					await auth.signOut();
					App.currentUser = null;
					localStorage.clear();
					routeTo("login", true);
				} catch (err) {
					console.error("Logout error:", err);
					alert("Failed to log out. Please try again.");
				}
			});
		}
	}

	/* =======================================
	 * 6. PROFILE DISCOVERY & SWIPING
	 * ======================================= */
	async function fetchAllProfiles() {
		// Mock logic to filter profiles based on user settings
		App.allProfiles = App.allProfiles.filter((profile) => {
			if (App.currentUser.settings.hideAccount) return false;
			if (profile.distance > App.currentUser.settings.maxDistance) return false;
			if (profile.age < App.currentUser.settings.ageRange[0] || profile.age > App.currentUser.settings.ageRange[1]) return false;
			return true;
		});
	}

	async function loadNextProfile() {
		// *** FIX: Check App.cardsStack (not App.cardsContainer) ***
		if (!App.cardsStack || !App.cardTemplate) return;

		// Clear only if no cards are left, and ensure the existing example cards are cleared.
		const existingCards = App.$$(".profile-card", App.cardsStack);
		
		if (App.allProfiles.length === 0 && existingCards.length <= 1) {
			App.cardsStack.innerHTML = `<div class="no-profiles neumorphic">No new profiles nearby. Try changing your settings.</div>`;
			return;
		}
		
		// Remove all existing mock cards except the first one (which we assume is the one the user should interact with)
		if (existingCards.length > 0) {
			existingCards.forEach((card, index) => {
				// We only want to remove the *initial mock* card. The logic will remove the current swiped card.
				if (index > 0 || card.getAttribute('data-user-id')) {
					card.remove(); 
				}
			});
		}
		
		// If there is no card left, or only a static one, load the new one
		if (App.allProfiles.length > 0 && App.$(".profile-card", App.cardsStack) === null) {
			const nextProfile = App.allProfiles.shift();
			renderSingleProfile(nextProfile);
		}
	}

	function renderSingleProfile(profile) {
		const card = App.cardTemplate.content.cloneNode(true);
		const profileCard = card.querySelector(".profile-card");
		
		profileCard.setAttribute("data-uid", profile.uid);
		// *** FIX: Use the correct class name for the image ***
		safeQuery(".profile-card__media img", card).src = profile.avatar;
		// *** FIX: Ensure age is rendered correctly in the template structure ***
		safeQuery(".profile-card__name", card).innerHTML = `${escapeHtml(profile.name)}, <span class="age neumorphic">${profile.age}</span>`;
		safeQuery(".profile-card__distance", card).textContent = `${profile.distance} km away`;
		safeQuery(".profile-card__bio", card).textContent = escapeHtml(profile.bio);

		// Prepend the new card so it's on top of the stack
		App.cardsStack.prepend(profileCard);
	}

	/**
	 * FIX: This function now reliably waits for the card animation to finish
	 * before removing the element and loading the next profile.
	 */
	async function handleCardAction(card, targetUid, action) {
		// Add an animation class or specific transition properties to ensure the animation plays
		card.style.transition = "transform 0.4s ease-out, opacity 0.4s ease-out";
		
		// Set up the final off-screen transform and reduce opacity
		const finalTranslateX = action === "like" ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
		const finalRotate = action === "like" ? 30 : -30;
		card.style.transform = `translate(${finalTranslateX}px, 0) rotate(${finalRotate}deg)`;
		card.style.opacity = 0;

		// 1. Wait for the CSS transition to complete (0.4s set above)
		const transitionPromise = new Promise(resolve => {
			const onTransitionEnd = (e) => {
				if (e.propertyName !== "transform") return;
				card.removeEventListener("transitionend", onTransitionEnd);
				resolve();
			};
			
			card.addEventListener("transitionend", onTransitionEnd);

			// Fallback: Use a safe timeout (slightly longer than the transition)
			setTimeout(() => {
				card.removeEventListener("transitionend", onTransitionEnd);
				resolve();
			}, 500); 
		});

		await transitionPromise;

		// 2. Final removal and cleanup
		if (card.parentNode) card.remove();
		console.log(`Mock: Swiped ${action} on ${targetUid}`);
		if (action === "like") {
			alert("It's a Match! 🎉 (Mocked)");
		}
		
		// 3. Load the next profile
		await loadNextProfile();
	}


	function bindCardActions() {
		// *** FIX: Listen on App.cardsStack (the container) ***
		if (!App.cardsStack) return;

		App.cardsStack.addEventListener("click", async (ev) => {
			// *** FIX: Select the correct buttons based on data-action in your HTML template ***
			const btn = ev.target.closest("button[data-action]");
			if (!btn) return;
			const action = btn.getAttribute("data-action");
			// Only act on buttons in the currently visible card (the one with the highest z-index/not scaled down)
			const card = App.cardsStack.firstElementChild;
			if (!card) return;

			const targetUid = card.getAttribute("data-uid") || card.getAttribute("data-user-id"); // Get UID from either mock or template

			if (action === "like" || action === "skip") {
				// This call will set the transition and call handleCardAction
				handleCardAction(card, targetUid, action);
			} else if (action === "message") {
				routeTo("messages", true);
				App.messageInput?.focus();
			}
			// Rewind/Super-Like logic remains unimplemented for this basic fix, but the buttons exist.
		});

		// *** FIX: Use the correct button ID from the HTML (discover-settings-btn) ***
		if (App.discoverSettingsBtn) {
			App.discoverSettingsBtn.addEventListener("click", () => routeTo("discover-settings", true));
		}
	}

	function bindSwipeLogic() {
		// *** FIX: Bind to App.cardsStack ***
		if (!App.cardsStack) return;

		App.cardsStack.addEventListener("pointerdown", (e) => {
			// Ensure we are only interacting with the very top card (the first child)
			const card = e.target.closest(".profile-card");
			if (!card || card !== App.cardsStack.firstElementChild) return;
			if (e.button !== 0 && e.pointerType === "mouse") return;

			App.isDragging = true;
			App.currentCard = card;
			App.startX = e.clientX;
			App.startY = e.clientY;

			card.setPointerCapture(e.pointerId);
			card.style.transition = "none"; // Disable CSS transition while dragging

			card.addEventListener("pointermove", handlePointerMove);
			card.addEventListener("pointerup", handlePointerUp);
			card.addEventListener("pointercancel", handlePointerUp);
		});

		function handlePointerMove(e) {
			if (!App.isDragging || !App.currentCard) return;

			const deltaX = e.clientX - App.startX;
			const deltaY = e.clientY - App.startY;
			const rotate = deltaX * App.ROTATION_FACTOR;

			App.currentCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;

			// Your current HTML template doesn't include .like-overlay or .skip-overlay, 
			// so we won't try to update their opacity, but leave the structure for future CSS
		}

		function handlePointerUp(e) {
			if (!App.isDragging || !App.currentCard) return;

			const card = App.currentCard;
			const deltaX = e.clientX - App.startX;
			const targetUid = card.getAttribute("data-uid") || card.getAttribute("data-user-id");

			card.removeEventListener("pointermove", handlePointerMove);
			card.removeEventListener("pointerup", handlePointerUp);
			card.removeEventListener("pointercancel", handlePointerUp);
			card.releasePointerCapture(e.pointerId);

			App.isDragging = false;
			App.currentCard = null;

			if (Math.abs(deltaX) > App.SWIPE_THRESHOLD) {
				const action = deltaX > 0 ? "like" : "skip";
				
				// Call the handler to wait for the animation and load next card
				handleCardAction(card, targetUid, action);
			} else {
				// Snap back animation
				card.style.transition = "transform 0.3s ease-in-out"; 
				card.style.transform = "translate(0, 0) rotate(0deg)";
			}
		}
	}

	/* =======================================
	 * 7. PROFILE MANAGEMENT & SETTINGS
	 * ======================================= */

	function renderProfilePage(profile) {
		// *** FIX: Corrected ID to profile-header-avatar ***
		if (App.profileHeaderAvatar) App.profileHeaderAvatar.src = profile.avatar;
		// *** FIX: Corrected avatar selector to match the menu structure ***
		if (App.navAvatar) App.navAvatar.src = profile.avatar; 

		// Update profile page details
		if (App.profileTitle) App.profileTitle.textContent = `${profile.name}, ${profile.age}`;
		// *** FIX: Targeting the p tags based on HTML structure ***
		const infoParagraphs = App.$$(".profile-header__info p");
		if (infoParagraphs.length >= 2) {
			infoParagraphs[0].textContent = profile.location?.city || "Unknown Location";
			infoParagraphs[1].textContent = profile.bio || "No bio yet.";
		}
		
		// Update photo gallery
		const photoGallery = App.$("#photo-gallery");
		if (photoGallery && Array.isArray(profile.photos)) {
			photoGallery.innerHTML = profile.photos.map(src => 
				`<div class="photo-item neumorphic"><img src="${escapeHtml(src)}" alt="User photo" /></div>`
			).join("");
		}

		// Update interests
		const interestsContainer = App.$("#profile-interests");
		if (interestsContainer && Array.isArray(profile.interests)) {
			interestsContainer.innerHTML = profile.interests.map((i) => `<span class="interest-tag neumorphic">${escapeHtml(i)}</span>`).join("");
		}
	}

	function loadProfileForEdit() {
		if (!App.profileForm || !App.currentUser) return;

		// *** FIX: All form fields are now correctly read from the currentUser object ***
		App.profileForm.querySelector("#profile-name").value = App.currentUser.name || "";
		App.profileForm.querySelector("#profile-age").value = App.currentUser.age || "";
		App.profileForm.querySelector("#profile-bio").value = App.currentUser.bio || "";
		App.profileForm.querySelector("#profile-gender").value = App.currentUser.gender || "";

		const interestsInput = App.profileForm.querySelector("#profile-interests-input");
		if (interestsInput && Array.isArray(App.currentUser.interests)) {
			interestsInput.value = App.currentUser.interests.join(", ");
		}
		
		// Note: The HTML profile-edit page does NOT contain settings/sliders. Those are in discover-settings.
	}
	
	function loadDiscoverySettings() {
		if (!App.currentUser) return;
		
		// Load Distance
		if (App.maxDistanceSlider) App.maxDistanceSlider.value = App.currentUser.settings.maxDistance;
		if (App.maxDistanceValue) App.maxDistanceValue.textContent = `${App.currentUser.settings.maxDistance} km`;
		
		// Load Age Range
		if (App.ageRangeMin) App.ageRangeMin.value = App.currentUser.settings.ageRange[0];
		if (App.ageRangeMax) App.ageRangeMax.value = App.currentUser.settings.ageRange[1];
		if (App.ageRangeValue) App.ageRangeValue.textContent = `${App.currentUser.settings.ageRange[0]} - ${App.currentUser.settings.ageRange[1]}`;
		
		// Load Gender to show (radio group)
		const showGenderInput = App.discoverySettingsForm.querySelector(`input[name="show-gender"][value="${App.currentUser.settings.showGender}"]`);
		if (showGenderInput) showGenderInput.checked = true;
		
		// Load Hide Account Toggle
		if (App.hideAccountToggle) App.hideAccountToggle.checked = App.currentUser.settings.hideAccount;
	}

	function bindProfileManagement() {
		if (App.editProfileBtn) {
			App.editProfileBtn.addEventListener("click", () => routeTo("profile-edit", true));
		}

		if (App.profileForm) {
			App.profileForm.addEventListener("submit", async (e) => {
				e.preventDefault();

				const name = App.profileForm.querySelector("#profile-name").value;
				const age = parseInt(App.profileForm.querySelector("#profile-age").value);
				const bio = App.profileForm.querySelector("#profile-bio").value;
				const gender = App.profileForm.querySelector("#profile-gender").value;
				const interests = App.profileForm.querySelector("#profile-interests-input")?.value.split(",").map((i) => i.trim()) || App.currentUser.interests;

				if (!name || isNaN(age) || !bio || !gender) {
					alert("Please fill in all required fields.");
					return;
				}

				// *** FIX: Handle image upload logic (mocked) ***
				const photoFile = App.profileForm.querySelector("#profile-photo-upload").files[0];
				let newPhotos = App.currentUser.photos;

				if (photoFile) {
					// Mock the upload process and update photos array
					const mockPhotoURL = URL.createObjectURL(photoFile);
					newPhotos = [...App.currentUser.photos, mockPhotoURL]; 
					console.log("Mock: Photo uploaded and URL generated:", mockPhotoURL);
				}

				App.pendingChanges = { ...App.currentUser, name, age, bio, gender, interests, photos: newPhotos };
				if (App.confirmationModal) App.confirmationModal.showModal();
			});
		}
		
		// *** FIX: Bind settings form on the discover-settings page ***
		if (App.discoverySettingsForm) {
			App.discoverySettingsForm.addEventListener("submit", async (e) => {
				e.preventDefault();
				
				const newSettings = {
					maxDistance: parseInt(App.maxDistanceSlider.value),
					ageRange: [parseInt(App.ageRangeMin.value), parseInt(App.ageRangeMax.value)],
					hideAccount: App.hideAccountToggle.checked,
					showGender: App.discoverySettingsForm.querySelector('input[name="show-gender"]:checked')?.value || App.currentUser.settings.showGender,
				};
				
				App.pendingChanges = { ...App.currentUser, settings: newSettings };
				if (App.confirmationModal) App.confirmationModal.showModal();
			});
		}

		if (App.confirmationModal && App.confirmBtn && App.cancelConfirmBtn) {
			App.confirmBtn.addEventListener("click", async () => {
				if (App.pendingChanges) {
					await saveUserProfile(App.pendingChanges);
					// *** FIX: Re-render profile and settings after saving ***
					renderProfilePage(App.currentUser);
					loadDiscoverySettings(); 
					alert("Changes confirmed!");
					routeTo("profile", true);
					App.pendingChanges = null;
				}
				App.confirmationModal.close();
			});
			App.cancelConfirmBtn.addEventListener("click", () => {
				App.pendingChanges = null;
				App.confirmationModal.close();
			});
		}

		// *** FIX: Update range value display on input ***
		const updateRangeValues = () => {
			if (App.maxDistanceSlider && App.maxDistanceValue) {
				App.maxDistanceValue.textContent = `${App.maxDistanceSlider.value} km`;
			}
			if (App.ageRangeMin && App.ageRangeMax && App.ageRangeValue) {
				const min = parseInt(App.ageRangeMin.value);
				const max = parseInt(App.ageRangeMax.value);
				// Ensure min is not greater than max
				if (min > max) App.ageRangeMax.value = min;
				App.ageRangeValue.textContent = `${App.ageRangeMin.value} - ${App.ageRangeMax.value}`;
			}
		};

		if (App.maxDistanceSlider) App.maxDistanceSlider.addEventListener("input", updateRangeValues);
		if (App.ageRangeMin) App.ageRangeMin.addEventListener("input", updateRangeValues);
		if (App.ageRangeMax) App.ageRangeMax.addEventListener("input", updateRangeValues);
	}

	/* =========================
	 * 8. MESSAGING (Preserved)
	 * ========================= */
	function bindMessageForm() {
		if (!App.messageForm) return;
		App.messageForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const text = App.messageInput.value.trim();
			if (!text) {
				alert("Please enter a message.");
				return;
			}

			const message = {
				text: escapeHtml(text),
				senderId: App.currentUser.uid,
				timestamp: firebase.firestore.FieldValue.serverTimestamp(),
			};

			console.log("Mock: Message Sent:", message);
			App.messageInput.value = "";
		});
	}

	/* =========================
	 * 9. UI/MODALS & EXTRAS
	 * ========================= */
	function bindUI() {
		const applyTheme = (initial = false) => {
			const savedTheme = localStorage.getItem("theme") || "light";
			// *** FIX: Corrected ID to dark-mode-toggle from the HTML ***
			if (App.darkModeToggle) App.darkModeToggle.checked = savedTheme === "dark";
			App.body.setAttribute("data-theme", savedTheme);
		};

		if (App.darkModeToggle) {
			applyTheme(true);
			App.darkModeToggle.addEventListener("change", (e) => {
				const newTheme = e.target.checked ? "dark" : "light";
				App.body.setAttribute("data-theme", newTheme);
				localStorage.setItem("theme", newTheme);
			});
		}

  /* =========================
   * 9. UI BINDINGS (With Donate Fix)
   * ========================= */
  function bindUI() {
    // Donate Modal Logic (Fixed with strict null checks)
    const donateLink = App.$('[data-route-link="donate"]');
    App.modalDonate = App.$("#modal-donate");
    if (donateLink && App.modalDonate) {
      donateLink.addEventListener("click", (e) => {
        e.preventDefault();
        App.modalDonate.showModal();
      });
    } else {
      console.warn("Donate link or modal not found. Donate functionality disabled.");
    }

    App.donateOptions = App.$(".donate-options");
    App.donateForm = App.$("#donation-form");
    App.donateAmountInput = App.$("#donate-amount");
    App.donateHeading = App.$("#donate-heading");
    App.cancelDonateBtn = App.$('[data-action="cancel-donate"]');
    let selectedProvider = null;

    const providerBtns = App.$$(".donate-options .btn");
    providerBtns.forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", () => {
          selectedProvider = btn.dataset.network || null;
          if (App.donateHeading) {
            App.donateHeading.textContent = selectedProvider ? `Donate with ${selectedProvider.toUpperCase()}` : "Donate to Support";
          } else {
            console.warn("Donate heading not found.");
          }
          if (App.donateOptions) App.donateOptions.hidden = true;
          if (App.donateForm) App.donateForm.hidden = false;
        });
      }
    });

    if (App.cancelDonateBtn) {
      App.cancelDonateBtn.addEventListener("click", () => {
        selectedProvider = null;
        if (App.donateForm) {
          App.donateForm.hidden = true;
        } else {
          console.warn("Donate form not found - cannot hide.");
        }
        if (App.donateOptions) {
          App.donateOptions.hidden = false;
        } else {
          console.warn("Donate options not found - cannot show.");
        }
      });
    } else {
      console.warn("Cancel donate button not found.");
    }

    if (App.donateForm) {
      App.donateForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!App.donateAmountInput) {
          console.warn("Donate amount input not found.");
          return;
        }
        const amount = parseFloat(App.donateAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid donation amount.");
          return;
        }

        if (!selectedProvider) {
          alert("Please select a mobile money provider.");
          return;
        }

        const targetPhoneNumber = selectedProvider === "airtel" ? "0994426162" : "0889479863";
        let ussd = "";
        if (selectedProvider === "airtel") {
          ussd = `*211*2*1*1*${targetPhoneNumber}*${amount}#`;
        } else if (selectedProvider === "tnm") {
          ussd = `*444*2*1*1*${targetPhoneNumber}*${amount}#`;
        }

        if (ussd) {
          alert(`Simulating USSD for ${selectedProvider.toUpperCase()}: ${ussd}. Check your phone to complete the transaction.`);
          // window.location.href = `tel:${ussd}`; // Uncomment if needed, but commented to prevent real calls
        }

        if (App.modalDonate) {
          App.modalDonate.close();
        } else {
          console.warn("Donate modal not found - cannot close.");
        }
        App.donateAmountInput.value = "";
      });
    } else {
      console.warn("Donate form not found. Submission disabled.");
    }

    // Other UI bindings (e.g., search, share) preserved with null checks
    const menuSearchInput = App.$(".menu-search-bar__input");
    if (menuSearchInput) {
      const debouncedSearch = debounce((query) => {
        if (query.length > 1) console.log(`Mock search: "${query}"`);
      }, 300);
      menuSearchInput.addEventListener("input", (e) => debouncedSearch(e.target.value));
    }

    const shareProfileBtn = App.$('[data-action="share-profile"]');
    if (shareProfileBtn) {
      shareProfileBtn.addEventListener("click", async () => {
        const profileUrl = `${window.location.origin}/#profile?uid=${App.currentUser.uid}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Check out ${App.currentUser.name}'s Profile!`,
              url: profileUrl,
            });
          } catch (error) {
            console.error("Error sharing:", error);
          }
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(profileUrl);
          alert("Profile URL copied to clipboard!");
        }
      });
    }
  }
		
		// *** FIX: Search Logic (Based on the menu search bar) ***
		// Note: The HTML has two search buttons/inputs. We'll prioritize the menu one for simplicity.
		const menuSearchInput = App.$(".menu-search-bar__input");
		
		if (menuSearchInput) {
			const debouncedMenuSearch = debounce((query) => {
				// Search results are not explicitly rendered in the menu's structure, 
				// so we'll just log the search action for mock purposes.
				if (query.length > 1) {
					console.log(`Mock: Searching for "${query}"`);
				}
			}, 300);
			menuSearchInput.addEventListener("input", (e) => debouncedMenuSearch(e.target.value));
		}

		if (App.shareProfileBtn) {
			App.shareProfileBtn.addEventListener("click", async () => {
				const profileUrl = `${window.location.origin}/#profile?uid=${App.currentUser.uid}`;
				if (navigator.share) {
					try {
						await navigator.share({
							title: `Check out ${App.currentUser.name}'s Profile!`,
							url: profileUrl,
						});
					} catch (error) {
						console.error("Error sharing:", error);
					}
				} else {
					navigator.clipboard.writeText(profileUrl);
					alert("Profile URL copied to clipboard!");
				}
			});
		}
	}

	/* =========================
	 * 10. INITIALIZATION
	 * ========================= */
	function cacheDomElements() {
		App.pages = App.$$(".page");
		App.pageMap = App.pages.reduce((m, p) => {
			const name = p.getAttribute("data-route");
			if (name) m[name] = p;
			return m;
		}, {});

		App.signupForm = App.$("#signup-form");
		App.loginForm = App.$("#login-form");
		App.profileForm = App.$("#profile-form");
		App.logoutBtn = App.$('[data-action="logout"]');
		// *** FIX: Swiping container selector corrected to .cards-stack ***
		App.cardsStack = App.$(".cards-stack");
		// *** FIX: Card template ID corrected to template-profile-card ***
		App.cardTemplate = App.$("#template-profile-card"); 
		// *** FIX: Profile page IDs corrected ***
		App.profileTitle = App.$("#profile-title");
		App.profileHeaderAvatar = App.$("#profile-header-avatar");
		App.navAvatar = App.$(".menu__item img"); // Avatar in the floating menu
		App.modalDonate = App.$("#modal-donate");
		App.editProfileBtn = App.$("#edit-profile-btn");
		App.mainHeader = App.$('[data-header-content="main-nav"]');
		App.pageHeader = App.$('[data-header-content="page-title"]');
		App.bottomNav = App.$(".bottom-nav");
		App.hamburgerMenu = App.$("#menu-main");
		App.hamburgerMenuBtn = App.$("#hamburger-menu-btn");
		// *** FIX: Corrected ID to dark-mode-toggle ***
		App.darkModeToggle = App.$("#dark-mode-toggle");
		App.donateForm = App.$("#donation-form");
		App.donateAmountInput = App.$("#donate-amount");
		App.donateHeading = App.$("#donate-heading");
		App.donateOptions = App.$(".donate-options");
		App.cancelDonateBtn = App.$('[data-action="cancel-donate"]');
		
		// *** FIX: Discovery Settings IDs (The form in the HTML has ID settings-form) ***
		App.discoverySettingsForm = App.$("#page-discover-settings #settings-form");
		App.maxDistanceSlider = App.$("#max-distance-slider");
		App.maxDistanceValue = App.$("#max-distance-value");
		App.ageRangeMin = App.$("#age-range-min");
		App.ageRangeMax = App.$("#age-range-max");
		App.ageRangeValue = App.$("#age-range-value");
		App.hideAccountToggle = App.$("#hide-account-toggle");
		
		App.confirmationModal = App.$("#confirmation-modal");
		App.confirmBtn = App.$("#confirm-btn");
		App.cancelConfirmBtn = App.$("#cancel-confirm-btn");
		App.shareProfileBtn = App.$('[data-action="share-profile"]');
		App.backButtons = App.$$('[data-action="back"]');
		App.messageForm = App.$("#message-form");
		App.messageInput = App.$("#message-input");
		// *** Added: Button in header for discovery settings ***
		App.discoverSettingsBtn = App.$("#discover-settings-btn");
	}

	async function init() {
		cacheDomElements();

		App.pages.forEach((p) => (p.hidden = true));

		// Check if a user is "logged in" based on our mock data
		if (App.currentUser) {
			await handleUserLogin(App.currentUser);
		} else {
			routeTo("landing", false); // Start on landing if not logged in
		}

		bindAuthForms();
		bindRouting();
		bindCardActions();
		bindSwipeLogic();
		bindProfileManagement();
		bindUI();
		bindMessageForm();

		const initialRoute = window.location.hash.substring(1) || "discover";
		routeTo(initialRoute, false);
	}

	document.addEventListener("DOMContentLoaded", init);
})();
