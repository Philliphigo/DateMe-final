// app.js — DateMe interactive logic
// IIFE to avoid polluting global scope
(() => {
  "use strict";

  /* =========================
	 Firebase Configuration
	 ========================= */
  const firebaseConfig = {
	apiKey: "AIzaSyA7nZ2Y51lfpkrwHKIvYe-y_EmyIk_WEfU",
	authDomain: "dateme-website.firebaseapp.com",
	projectId: "dateme-website",
	storageBucket: "dateme-website.firebasestorage.app",
	messagingSenderId: "589523570810",
	appId: "1:589523570810:web:b0e7f6520242704ebdebc3",
	// Note: measurementId isn't used in v8 of the SDK, so you can leave it out.
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  /* =========================
	 DOM cache & State
	 ========================= */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const body = document.body;
  const pages = $$(".page");
  const pageMap = pages.reduce((m, p) => {
	const name = p.getAttribute("data-route");
	if (name) m[name] = p;
	return m;
  }, {});

  const signupForm = $("#signup-form");
  const loginForm = $("#login-form");
  const onboardingForm = $("#onboarding-form");
  const profileForm = $("#profile-form");
  const mainNav = $("nav.main-nav");
  const avatarBtn = $(".avatar-btn");
  const logoutBtn = $("[data-action='logout']");
  const cardTemplate = $("#template-profile-card");
  const cardsContainer = $(".cards");
  const profileHeaderName = $("#profile-title");
  const profileHeaderBio = $(".profile-header__info p");
  const profileHeaderAvatar = $(".profile-header__media img");
  const navAvatar = $(".header .avatar-btn img");
  // Photo-related DOM elements have been removed from here
  const modalDonate = $("#modal-donate");
  const editProfileBtn = $("#edit-profile-btn");
  const saveProfileBtn = $("#save-profile-btn");
  // NEW DONATION-RELATED DOM ELEMENTS
  const donateForm = $('#donation-form');
  const donateAmountInput = $('#donate-amount');
  const donateHeading = $('#donate-heading');
  const donateOptions = $('.donate-options');
  const airtelBtn = $('[data-action="select-airtel"]');
  const tnmBtn = $('[data-action="select-tnm"]');
  const cancelDonateBtn = $('[data-action="cancel-donate"]');
  // NEW MESSAGING DOM ELEMENTS
  const messagesContainer = $('#messages-container');
  const messageForm = $('#message-form');
  const messageInput = $('#message-input');
  const chatHeader = $('#chat-header');
  const convoList = $('.convo-list');
  const convoTemplate = $('#template-convo');
  const messageTemplateMe = $('#template-message-me');
  const messageTemplateThem = $('#template-message-them');
  const chatBody = $('#chat-body');

  // New DOM elements for requested features
  const searchIcon = $('[data-action="search"]'); // Assume this exists in header
  const searchContainer = $('#search-container'); // Assume a modal or div for search
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  const refreshBtn = $('[data-action="refresh-profiles"]'); // Assume button in discover
  const maxDistanceSlider = $('#max-distance-slider');
  const maxDistanceValue = $('#max-distance-value');
  const ageRangeMin = $('#age-range-min');
  const ageRangeMax = $('#age-range-max');
  const ageRangeValue = $('#age-range-value');
  const hideAccountToggle = $('#hide-account-toggle');
  const confirmationModal = $('#confirmation-modal'); // Assume modal for confirms
  const confirmBtn = $('#confirm-btn');
  const cancelConfirmBtn = $('#cancel-confirm-btn');
  const shareProfileBtn = $('[data-action="share-profile"]'); // Assume in profile page
  const backButtons = $$('[data-action="back"]'); // All back buttons
  const settingsLinks = $$('.settings-link'); // Assume class on settings items

  let currentUser = {
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
	avatar: "https://placehold.co/120x120?text=Phil",
	photos: ["https://placehold.co/240x240?text=Phil+1", "https://placehold.co/240x240?text=Phil+2", "https://placehold.co/240x240?text=Phil+3"],
	settings: { maxDistance: 50, ageRange: [18, 30], hideAccount: false },
  };
  let allProfiles = [
	  {
		uid: "temp-profile-1",
		name: "Jane",
		age: 22,
		bio: "Loves to read and hike.",
		onboardingComplete: true,
		location: { city: "Blantyre" },
		avatar: "https://placehold.co/120x120?text=Jane",
		distance: 12,
		isOnline: true,
	  },
	  {
		uid: "temp-profile-2",
		name: "John",
		age: 25,
		bio: "Musician and artist.",
		onboardingComplete: true,
		location: { city: "Lilongwe" },
		avatar: "https://placehold.co/120x120?text=John",
		distance: 3,
		isOnline: false,
	  },
	  {
		uid: "temp-profile-3",
		name: "Sarah",
		age: 21,
		bio: "Student and coffee addict.",
		onboardingComplete: true,
		location: { city: "Zomba" },
		avatar: "https://placehold.co/120x120?text=Sarah",
		distance: 80,
		isOnline: true,
	  },
  ];
  let currentMatchId = null;
  let pendingChanges = null; // For confirmation

  /* =========================
	 Helper utilities
	 ========================= */
  const safeQuery = (sel, ctx = document) => {
	try { return ctx.querySelector(sel); }
	catch (e) { return null; }
  };
  const createElFromHTML = htmlStr => {
	const tpl = document.createElement("template");
	tpl.innerHTML = htmlStr.trim();
	return tpl.content.firstElementChild;
  };
  const escapeHtml = unsafe => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  
  // New helper for debouncing (for search)
  const debounce = (func, delay) => {
	let timeout;
	return (...args) => {
	  clearTimeout(timeout);
	  timeout = setTimeout(() => func(...args), delay);
	};
  };

  /* =========================
	 AUTHENTICATION
	 ========================= */
  // The checkAuthState function is no longer needed since we are not using Firebase Auth.
  async function checkAuthState() {
	auth.onAuthStateChanged(async user => {
	  if (user) {
		// Check if email is verified
		if (!user.emailVerified) {
		  console.log('User signed in but email not verified.');
		  alert('Please verify your email address to continue.');
		  await auth.signOut(); // Log them out if not verified
		  routeTo("login", false);
		  return;
		}

		currentUser = await fetchUserProfile(user.uid);
		if (currentUser && currentUser.onboardingComplete) {
		  console.log('User signed in:', currentUser.email);
		  await handleUserLogin(currentUser);
		} else {
		  console.log('User signed in, but profile not found or onboarding not complete. Redirecting.');
		  routeTo("onboarding", false);
		}
	  } else {
		console.log('User logged out.');
		currentUser = null;
		body.classList.remove('logged-in');
		routeTo("login", false);
	  }
	});
  }

  async function handleUserLogin(userProfile) {
	currentUser = userProfile;
	body.classList.add('logged-in');
	
	renderProfilePage(currentUser);
	
	await fetchAllProfiles();
	await loadNextProfile();

	routeTo("home", false);
  }

  function bindAuthForms() {
	if (signupForm) {
	  signupForm.addEventListener("submit", async e => {
		e.preventDefault();
		const email = signupForm.querySelector("#signup-email").value;
		const password = signupForm.querySelector("#signup-password").value;
		const confirmPassword = signupForm.querySelector("#signup-confirm-password").value;
		
		if (password !== confirmPassword) {
		  alert("Passwords do not match!");
		  return;
		}
		
		try {
		  const { user } = await auth.createUserWithEmailAndPassword(email, password);
		  
		  // Send email verification
		  await user.sendEmailVerification();

		  const newProfile = {
			uid: user.uid,
			email: user.email,
			onboardingComplete: false,
			isSubscriber: false,
			settings: { gender: "all", distance: 50, ageRange: [18, 30], hideAccount: false },
		  };
		  
		  await saveUserProfile(newProfile);
		  console.log('User created. Please check your email for verification.');
		  alert('Account created! Please check your email to verify your address before logging in.');
		  
		  await auth.signOut(); // Force log out to require email verification
		  routeTo("login", true); 
		} catch (err) {
		  alert("Signup failed: " + err.message);
		}
	  });
	}
	
	if (onboardingForm) {
	  onboardingForm.addEventListener("submit", async e => {
		e.preventDefault();
		const name = onboardingForm.querySelector("#onboarding-name").value;
		const age = parseInt(onboardingForm.querySelector("#onboarding-age").value);
		const gender = onboardingForm.querySelector("#onboarding-gender").value;
		const bio = onboardingForm.querySelector("#onboarding-bio").value;
		
		try {
		  const updatedProfile = {
			...currentUser,
			name: name,
			age: age,
			gender: gender,
			bio: bio,
			onboardingComplete: true,
			location: { city: "New York", lat: 40.7128, lon: -74.0060 },
			interests: ["Coding", "Hiking"],
			avatar: "https://placehold.co/120x120?text=User", // Default placeholder
			photos: [], // Empty photo array
		  };
		  
		  await saveUserProfile(updatedProfile);
		  await handleUserLogin(updatedProfile);
		  console.log('Onboarding complete. Welcome!');
		} catch (err) {
		  console.error("Onboarding failed:", err);
		  alert("Onboarding failed: " + err.message);
		}
	  });
	}

	if (loginForm) {
	  loginForm.addEventListener("submit", async e => {
		e.preventDefault();
		const email = loginForm.querySelector("#login-email").value;
		const password = loginForm.querySelector("#login-password").value;
		try {
		  await auth.signInWithEmailAndPassword(email, password);
		} catch (err) {
		  alert("Login failed: " + err.message);
		}
	  });
	}
	
	if (logoutBtn) {
	  logoutBtn.addEventListener("click", async () => {
		try {
		  await auth.signOut();
		  currentUser = null; // Clear current user for real logout
		  localStorage.clear(); // Clear any stored data
		  routeTo("login", true);
		} catch (err) {
		  console.error("Logout error:", err);
		}
	  });
	}
  }

  async function saveUserProfile(profileData) {
	//await db.collection("users").doc(profileData.uid).set(profileData, { merge: true });
	// Since we are not connected to Firebase, this function will not do anything.
	console.log("Profile data saved (simulated):", profileData);
	currentUser = profileData;
  }

  async function fetchUserProfile(uid) {
	// Since we are not connected to Firebase, this will return a hardcoded profile for now
	return {
		uid: uid,
		name: "Jane",
		age: 22,
		bio: "Loves to read and hike.",
		onboardingComplete: true,
		location: { city: "Blantyre" },
		avatar: "https://placehold.co/120x120?text=Jane",
		distance: 12,
		isOnline: true,
	};
  }
  
  // The uploadPhoto function has been completely removed.
  
  /* =========================
	 ROUTING (simple SPA)
	 ========================= */
  function bindRouting() {
	document.addEventListener("click", ev => {
	  const link = ev.target.closest("[data-route-link]");
	  if (!link) return;
	  ev.preventDefault();
	  const route = link.getAttribute("data-route-link");
	  if (!route) return;
	  
	  const targetUid = link.getAttribute('data-target-uid');
	  if (route === 'messages' && targetUid) {
		  // const matchId = [currentUser.uid, targetUid].sort().join('_');
		  // currentMatchId = matchId;
		  // getLiveMessages(matchId, targetUid);
	  }
	  
	  routeTo(route, true);
	});
	
	window.addEventListener('popstate', (e) => {
		const route = e.state?.route || 'home';
		routeTo(route, false);
	});
  }
  
  function routeTo(routeName = "home", push = true) {
	// Since we're not using auth, we'll remove this block
	// if (!currentUser && routeName !== "login" && routeName !== "signup") {
	//   routeName = "login";
	// }
	
	if (routeName === "login" || routeName === "signup") {
	  body.classList.add('auth-page');
	} else {
	  body.classList.remove('auth-page');
	}

	pages.forEach(p => {
	  p.classList.remove("is-visible");
	  p.hidden = true;
	});

	const target = pageMap[routeName];
	if (!target) {
	  console.warn("Unknown route:", routeName);
	  routeName = "home";
	}
	
	const currentPage = pageMap[routeName];
	if (currentPage) {
		currentPage.classList.add("is-visible");
		currentPage.hidden = false;
	}

	// This part is for real-time data, which won't work without a logged-in user.
	// You'll need to re-implement or mock this logic if you want to see this page.
	if (routeName === 'messages') {
		// renderConvoList();
	}
	
	if (push) {
	  history.pushState({ route: routeName }, "", `#${routeName}`);
	}
  }

  /* =========================
	 PROFILES — render & interactions
	 ========================= */
  async function fetchAllProfiles() {
	// Instead of fetching from Firebase, we'll use our hardcoded list
	console.log("Simulating fetching profiles...");
	// Apply filters based on settings
	allProfiles = allProfiles.filter(profile => {
	  if (currentUser.settings.hideAccount) return false; // Simulate hiding
	  if (profile.distance > currentUser.settings.maxDistance) return false;
	  if (profile.age < currentUser.settings.ageRange[0] || profile.age > currentUser.settings.ageRange[1]) return false;
	  return true;
	});
  }

  async function loadNextProfile() {
	if (!cardsContainer || !cardTemplate) return;
	
	cardsContainer.innerHTML = '';
	
	if (allProfiles.length === 0) {
	  cardsContainer.innerHTML = `<div class="no-profiles">No new profiles nearby. Try changing your settings.</div>`;
	  return;
	}
	
	const nextProfile = allProfiles.shift();
	renderSingleProfile(nextProfile);
  }

  function renderSingleProfile(profile) {
	if (!cardsContainer || !cardTemplate) return;
	
	const card = cardTemplate.content.cloneNode(true);
	card.querySelector(".profile-card").setAttribute("data-uid", profile.uid);
	safeQuery(".profile-card__media img", card).src = profile.avatar;
	safeQuery(".profile-card__title", card).textContent = `${profile.name}, ${profile.age}`;
	safeQuery(".profile-card__meta", card).textContent = profile.location.city;
	safeQuery(".profile-card__bio", card).textContent = profile.bio;
	// No isOnline property in our mocked data
	// safeQuery(".profile-card__status .status--online", card).textContent = profile.isOnline ? "Online" : "Offline";
	safeQuery(".profile-card__distance", card).textContent = `${profile.distance} km away`;
	
	cardsContainer.appendChild(card);
  }
  
  // NEW: Matching Logic Functions
  async function saveUserSwipe(targetUid, action) {
	// No Firebase, so we'll just log the action
	console.log(`Simulated swipe: User liked/skipped profile ${targetUid} with action '${action}'`);
  }

  async function checkForMatch(targetUid) {
	// Since we don't have a database, we'll just return true to simulate a match
	return true;
  }

  async function createMatch(targetUid) {
	// No Firebase, so we'll just log the match
	console.log(`Simulated match found with ${targetUid}!`);
  }

  function bindCardActions() {
	if (!cardsContainer) return;
	cardsContainer.addEventListener("click", async ev => {
	  const btn = ev.target.closest("button[data-action]");
	  if (!btn) return;
	  const action = btn.getAttribute("data-action");
	  const card = btn.closest(".profile-card");
	  if (!card) return;
	  
	  const targetUid = card.getAttribute("data-uid");
	  
	  if (action === "like" || action === "skip") {
		// Animate fall
		card.classList.add(action === "like" ? "fall-right" : "fall-left");
		card.addEventListener("animationend", async () => {
		  card.remove();
		  await saveUserSwipe(targetUid, action);
		  if (action === "like") {
			const isMatch = await checkForMatch(targetUid);
			if (isMatch) {
			  alert("It's a Match! 🎉");
			}
		  }
		  await loadNextProfile();
		}, { once: true });
	  } else if (action === "message") { // Assuming star is data-action="message"
		const targetUid = card.getAttribute("data-uid");
		// Open message inbox
		routeTo("messages", true);
		messageInput.focus(); // Pre-focus for writing message
	  }
	});
  }

  /* =========================
	 MESSAGING
	 ========================= */

  // The messaging functions are tied to Firebase, so they won't work in this state.
  // I am leaving them here but they will not be functional.

  async function renderConvoList() {
	if (!convoList) return;
	convoList.innerHTML = '';
	const snapshot = await db.collection("matches").where("users", "array-contains", currentUser.uid).get();
	
	const matches = snapshot.docs.map(doc => {
	  const matchData = doc.data();
	  const otherUserUid = matchData.users.find(uid => uid !== currentUser.uid);
	  return {
		...matchData,
		id: doc.id,
		otherUserUid: otherUserUid,
	  };
	});

	for (const match of matches) {
		const profile = await fetchUserProfile(match.otherUserUid);
		if (profile) {
			const convo = convoTemplate.content.cloneNode(true);
			const link = convo.querySelector('.convo');
			link.setAttribute('data-target-uid', profile.uid);
			safeQuery('.convo__avatar', convo).src = profile.avatar;
			safeQuery('.convo__name', convo).textContent = profile.name;
			safeQuery('.convo__last', convo).textContent = match.lastMessage || 'Start a conversation!';
			convoList.appendChild(convo);
		}
	}
  }

  function getLiveMessages(matchId, targetUid) {
	if (!chatBody) return;
	
	chatBody.innerHTML = '';
	safeQuery('.chat').style.display = 'grid';
	
	fetchUserProfile(targetUid).then(profile => {
	  if (profile && chatHeader) {
		chatHeader.querySelector('.chat__peer-name').textContent = profile.name;
	  }
	});
	
	const messagesRef = db.collection("matches").doc(matchId).collection("messages").orderBy("timestamp");
	messagesRef.onSnapshot(snapshot => {
	  snapshot.docChanges().forEach(change => {
		if (change.type === "added") {
		  const msg = change.doc.data();
		  renderSingleMessage(msg);
		}
	  });
	  chatBody.scrollTop = chatBody.scrollHeight;
	});
  }

  function renderSingleMessage(msg) {
	if (!chatBody) return;
	const isMe = msg.senderId === currentUser.uid;
	const template = isMe ? messageTemplateMe : messageTemplateThem;
	const bubble = template.content.cloneNode(true);
	safeQuery('.bubble__text', bubble).textContent = msg.text;
	if (msg.timestamp) {
	  const time = msg.timestamp.toDate();
	  safeQuery('time', bubble).textContent = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
	}
	chatBody.appendChild(bubble);
  }
  
  function bindMessageForm() {
	  if (!messageForm) return;
	  messageForm.addEventListener('submit', async (e) => {
		  e.preventDefault();
		  const text = messageInput.value.trim();
		  if (text === "" || !currentMatchId) return;

		  const message = {
			  text: escapeHtml(text),
			  senderId: currentUser.uid,
			  timestamp: firebase.firestore.FieldValue.serverTimestamp()
		  };
		  
		  try {
			  await db.collection("matches").doc(currentMatchId).collection("messages").add(message);
			  await db.collection("matches").doc(currentMatchId).update({
				  lastMessage: text
			  });
			  messageInput.value = '';
		  } catch (error) {
			  console.error("Error sending message:", error);
		  }
	  });
  }


  /* =========================
	 UI Render
	 ========================= */
  function renderProfilePage(profile) {
	if (!profile) return;
	if (profileHeaderName) profileHeaderName.textContent = `${profile.name}, ${profile.age}`;
	if (profileHeaderBio) profileHeaderBio.textContent = `${profile.location?.city || "Unknown"} • ${profile.bio || "No bio yet."}`;
	if (profileHeaderAvatar) profileHeaderAvatar.src = profile.avatar;
	if (navAvatar) navAvatar.src = profile.avatar;
	
	// The profile photo grid is no longer rendered here
  }
  
  /* =========================
	 Profile Management
	 ========================= */
  function bindProfileManagement() {
	if (editProfileBtn) {
	  editProfileBtn.addEventListener("click", () => {
		routeTo("profile-edit", true);
	  });
	}
	
	// The photo upload event listener has been removed from here
	
	if (profileForm) {
	  profileForm.querySelector("#profile-name").value = currentUser.name || "";
	  profileForm.querySelector("#profile-age").value = currentUser.age || "";
	  profileForm.querySelector("#profile-bio").value = currentUser.bio || "";
	  profileForm.querySelector("#profile-gender").value = currentUser.gender || "";
	  
	  profileForm.addEventListener("submit", async e => {
		e.preventDefault();
		
		pendingChanges = {
		  ...currentUser,
		  name: profileForm.querySelector("#profile-name").value,
		  age: parseInt(profileForm.querySelector("#profile-age").value),
		  bio: profileForm.querySelector("#profile-bio").value,
		  gender: profileForm.querySelector("#profile-gender").value
		};

		// Show confirmation modal
		if (confirmationModal) confirmationModal.showModal();
	  });
	}
  }
  
  /* =========================
	 UI Elements & Modals
	 ========================= */
  function bindUI() {
	const themeSwitch = $('#theme-switch');
	if (themeSwitch) {
	  themeSwitch.addEventListener('change', () => {
		body.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
	  });
	}

	const donateLink = $('[data-action="donate"]');
	if (donateLink && modalDonate) {
	  donateLink.addEventListener('click', (e) => {
		e.preventDefault();
		modalDonate.showModal();
	  });
	  modalDonate.addEventListener('click', (e) => {
		if (e.target.tagName === 'DIALOG') {
		  modalDonate.close();
		}
	  });
	  const closeModalBtn = modalDonate.querySelector('.btn--close');
	  if (closeModalBtn) {
		closeModalBtn.addEventListener('click', () => modalDonate.close());
	  }
	}
	
	// NEW: Donation logic
	let selectedProvider = null;
	
	if (airtelBtn) {
	  airtelBtn.addEventListener('click', () => {
		selectedProvider = "airtel";
		donateHeading.textContent = "Airtel Money";
		donateOptions.hidden = true;
		donateForm.hidden = false;
	  });
	}
	
	if (tnmBtn) {
	  tnmBtn.addEventListener('click', () => {
		selectedProvider = "tnm";
		donateHeading.textContent = "TNM Mpamba";
		donateOptions.hidden = true;
		donateForm.hidden = false;
	  });
	}
	
	if (cancelDonateBtn) {
	  cancelDonateBtn.addEventListener('click', () => {
		selectedProvider = null;
		donateForm.hidden = true;
		donateOptions.hidden = false;
	  });
	}

	if (donateForm) {
	  donateForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const amount = donateAmountInput.value;
		let ussd;
		
		if (selectedProvider === "airtel") {
		  ussd = `*211*2*1*1*0994426162*${amount}#`;
		} else if (selectedProvider === "tnm") {
		  ussd = `*444*2*1*1*0889479863*${amount}#`;
		}
		
		if (ussd) {
		  window.location.href = `tel:${ussd}`;
		} else {
		  alert("Please select a mobile money provider.");
		}
		
		modalDonate.close();
	  });
	}

	// New: Search functionality
	if (searchIcon && searchContainer) {
	  searchIcon.addEventListener('click', () => {
		searchContainer.classList.toggle('active'); // Show/hide search
		searchInput.focus();
	  });
	  const debouncedSearch = debounce((query) => {
		searchResults.innerHTML = '';
		if (query.length < 2) return;
		const matches = allProfiles.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
		matches.forEach(match => {
		  const resultItem = document.createElement('div');
		  resultItem.classList.add('search-result');
		  resultItem.textContent = match.name;
		  resultItem.addEventListener('click', () => {
			// Route to profile or highlight
			routeTo('profile', true); // Example
			searchContainer.classList.remove('active');
		  });
		  searchResults.appendChild(resultItem);
		});
	  }, 300);
	  searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
	}

	// New: Refresh button
	if (refreshBtn) {
	  refreshBtn.addEventListener('click', async () => {
		refreshBtn.classList.add('spinning'); // Assume CSS animation
		await fetchAllProfiles(); // Refetch with filters
		await loadNextProfile();
		setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
	  });
	}

	// New: Discovery settings sliders
	if (maxDistanceSlider && maxDistanceValue) {
	  maxDistanceSlider.addEventListener('input', (e) => {
		currentUser.settings.maxDistance = parseInt(e.target.value);
		maxDistanceValue.textContent = `${currentUser.settings.maxDistance} km`;
	  });
	}
	if (ageRangeMin && ageRangeMax && ageRangeValue) {
	  const updateAgeValue = () => {
		ageRangeValue.textContent = `${ageRangeMin.value} - ${ageRangeMax.value}`;
		currentUser.settings.ageRange = [parseInt(ageRangeMin.value), parseInt(ageRangeMax.value)];
	  };
	  ageRangeMin.addEventListener('input', updateAgeValue);
	  ageRangeMax.addEventListener('input', updateAgeValue);
	}
	if (hideAccountToggle) {
	  hideAccountToggle.addEventListener('change', (e) => {
		currentUser.settings.hideAccount = e.target.checked;
		// Apply immediately or on save
	  });
	}

	// New: Confirmation for saves
	if (confirmationModal && confirmBtn && cancelConfirmBtn) {
	  confirmBtn.addEventListener('click', async () => {
		if (pendingChanges) {
		  await saveUserProfile(pendingChanges);
		  currentUser = pendingChanges;
		  renderProfilePage(currentUser);
		  alert("Changes confirmed!");
		  routeTo("profile", true);
		  pendingChanges = null;
		}
		confirmationModal.close();
	  });
	  cancelConfirmBtn.addEventListener('click', () => {
		pendingChanges = null;
		confirmationModal.close();
	  });
	}

	// New: Share profile
	if (shareProfileBtn) {
	  shareProfileBtn.addEventListener('click', () => {
		const profileUrl = `${window.location.origin}/#profile?uid=${currentUser.uid}`;
		navigator.clipboard.writeText(profileUrl).then(() => {
		  alert("Profile URL copied to clipboard!");
		});
	  });
	}

	// New: Back buttons with animation
	backButtons.forEach(btn => {
	  btn.addEventListener('click', () => {
		body.classList.add('slide-back'); // Assume CSS transition
		history.back();
		setTimeout(() => body.classList.remove('slide-back'), 300);
	  });
	});

	// New: Settings links
	settingsLinks.forEach(link => {
	  link.addEventListener('click', (e) => {
		const target = link.getAttribute('data-target-section');
		if (target === 'support') routeTo('contact', true);
		if (target === 'transactions') routeTo('donate', true);
		if (target === 'manage-photos') routeTo('profile-edit', true); // Assuming photos in edit
		if (target === 'subscriptions') routeTo('donate', true);
	  });
	});
  }

  /* =========================
	 Init everything
	 ========================= */
  async function init() {
	pages.forEach(p => p.hidden = true);
	
	// await checkAuthState(); // Comment out to skip auth check
	
	// Add some temporary user data so the UI can be rendered
	handleUserLogin(currentUser);

	bindAuthForms();
	bindRouting();
	bindCardActions();
	bindProfileManagement();
	bindUI();
	bindMessageForm();
  }

  document.addEventListener("DOMContentLoaded", () => init());

})();
