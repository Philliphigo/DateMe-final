// app.js — DateMe interactive logic
// IIFE to avoid polluting global scope
(() => {
  "use strict";

  /* =========================
   Mock Database & State
   ========================= */
  const mockDatabase = {
	users: [],
	profiles: [
	  {
		uid: "temp-profile-1",
		email: "jane@example.com",
		name: "Jane",
		age: 22,
		bio: "Loves to read and hike.",
		onboardingComplete: true,
		location: { city: "Blantyre" },
		avatar: "https://placehold.co/120x120?text=Jane",
		photos: ["https://placehold.co/240x240?text=Jane+1", "https://placehold.co/240x240?text=Jane+2"],
		interests: ["Reading", "Hiking", "Coffee", "Dogs"]
	  },
	  {
		uid: "temp-profile-2",
		email: "john@example.com",
		name: "John",
		age: 25,
		bio: "Musician and artist.",
		onboardingComplete: true,
		location: { city: "Lilongwe" },
		avatar: "https://placehold.co/120x120?text=John",
		photos: ["https://placehold.co/240x240?text=John+1"],
		interests: ["Music", "Art", "Travel"]
	  },
	  {
		uid: "temp-profile-3",
		email: "sarah@example.com",
		name: "Sarah",
		age: 21,
		bio: "Student and coffee addict.",
		onboardingComplete: true,
		location: { city: "Zomba" },
		avatar: "https://placehold.co/120x120?text=Sarah",
		photos: ["https://placehold.co/240x240?text=Sarah+1", "https://placehold.co/240x240?text=Sarah+2", "https://placehold.co/240x240?text=Sarah+3"],
		interests: ["Studying", "Coffee", "Movies"]
	  },
	],
	matches: [],
	messages: {}
  };

  const db = mockDatabase;
  let currentUser = null;
  let allProfiles = [...db.profiles];
  let currentMatchId = null;
  let swipedCardsHistory = []; // ✨ NEW STATE for Rewind functionality

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
  const cardsContainer = $(".cards-stack"); // Updated selector to match your CSS
  const profileHeaderName = $("#profile-title");
  const profileHeaderBio = $(".profile-header__info p");
  const profileHeaderAvatar = $(".profile-header__media img");
  const navAvatar = $(".header .avatar-btn img");
  const photoGallery = $("#photo-gallery");
  const photoPlaceholder = $("#photo-placeholder");
  const photoUploadInput = $("#profile-photo-upload");
  const photoPreviewGrid = $("#photo-preview-grid");
  const photoManagementModal = $("#modal-photo-management");
  const modalDonate = $("#modal-donate");
  const editProfileBtn = $("#edit-profile-btn");
  const saveProfileBtn = $("#save-profile-btn");
  const shareProfileBtn = $("#share-profile-btn");
  const donateForm = $('#donation-form');
  const donateAmountInput = $('#donate-amount');
  const donateHeading = $('#donate-heading');
  const donateOptions = $('.donate-options');
  const airtelBtn = $('[data-action="select-airtel"]');
  const tnmBtn = $('[data-action="select-tnm"]');
  const cancelDonateBtn = $('[data-action="cancel-donate"]');
  const messagesContainer = $('#messages-container');
  const messageForm = $('#message-form');
  const messageInput = $('#message-input');
  const chatHeader = $('#chat-header');
  const convoList = $('.convo-list');
  const convoTemplate = $('#template-convo');
  const messageTemplateMe = $('#template-message-me');
  const messageTemplateThem = $('#template-message-them');
  const chatBody = $('#chat-body');
  // ✨ NEW DOM ELEMENTS
  const searchInput = $('.search-bar__input');
  const searchBarContainer = $('.search-bar');
  const searchResultsContainer = $('#search-results-list'); // Assumed element in HTML
  const backButtons = $$('[data-action="back"]');
  const distanceSlider = $('#settings-distance-range');
  const distanceValue = $('#settings-distance-value');
  const ageMinSlider = $('#settings-age-min');
  const ageMaxSlider = $('#settings-age-max');
  const ageValue = $('#settings-age-value');
  const hideAccountSwitch = $('#settings-hide-account');
  const discoverySettingsForm = $('#discovery-settings-form');
  const confirmationToast = $('#confirmation-toast'); // Assumed element in HTML
  // END NEW DOM ELEMENTS


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
  
  // ✨ NEW UTILITY FUNCTION
  function showConfirmationToast(message) {
	if (confirmationToast) {
	  confirmationToast.textContent = message;
	  confirmationToast.classList.add('is-visible');
	  setTimeout(() => {
		confirmationToast.classList.remove('is-visible');
	  }, 3000);
	}
  }
  // END NEW UTILITY FUNCTION

  /* =========================
   AUTHENTICATION (Mocked)
   ========================= */
  function saveUserProfile(profileData) {
	let index = db.profiles.findIndex(p => p.uid === profileData.uid);
	if (index !== -1) {
	  db.profiles[index] = profileData;
	} else {
	  db.profiles.push(profileData);
	}
	currentUser = profileData;
	console.log("Profile data saved (mocked):", profileData);
  }

  function fetchUserProfile(uid) {
	return db.profiles.find(p => p.uid === uid);
  }

  function handleUserLogin(userProfile) {
	currentUser = userProfile;
	body.classList.add('logged-in');
	
	renderProfilePage(currentUser);
	
	allProfiles = db.profiles.filter(p => p.uid !== currentUser.uid);
	loadNextProfile();

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

		if (db.profiles.find(u => u.email === email)) {
		  alert("An account with this email already exists.");
		  return;
		}

		const newUserUid = `user-${Date.now()}`;
		const newProfile = {
		  uid: newUserUid,
		  email: email,
		  onboardingComplete: false,
		  isSubscriber: false,
		  settings: { gender: "all", distance: 50, ageRange: [18, 30], hideAccount: false },
		};
		
		saveUserProfile(newProfile);
		alert('Account created! Please log in to complete your profile.');
		routeTo("login", true); 
	  });
	}
	
	if (onboardingForm) {
	  onboardingForm.addEventListener("submit", async e => {
		e.preventDefault();
		const name = onboardingForm.querySelector("#onboarding-name").value;
		const age = parseInt(onboardingForm.querySelector("#onboarding-age").value);
		const gender = onboardingForm.querySelector("#onboarding-gender").value;
		const bio = onboardingForm.querySelector("#onboarding-bio").value;
		
		const updatedProfile = {
		  ...currentUser,
		  name: name,
		  age: age,
		  gender: gender,
		  bio: bio,
		  onboardingComplete: true,
		  location: { city: "New York", lat: 40.7128, lon: -74.0060 },
		  interests: ["Coding", "Hiking"],
		  avatar: "https://placehold.co/120x120?text=User",
		  photos: [],
		};
		
		saveUserProfile(updatedProfile);
		handleUserLogin(updatedProfile);
		console.log('Onboarding complete. Welcome!');
	  });
	}

	if (loginForm) {
	  loginForm.addEventListener("submit", async e => {
		e.preventDefault();
		const email = loginForm.querySelector("#login-email").value;
		const password = loginForm.querySelector("#login-password").value;
		
		const userProfile = db.profiles.find(u => u.email === email);
		if (userProfile) {
		  handleUserLogin(userProfile);
		} else {
		  alert("Login failed: User not found.");
		}
	  });
	}
	
	if (logoutBtn) {
	  logoutBtn.addEventListener("click", async () => {
		currentUser = null;
		body.classList.remove('logged-in');
		routeTo("login", false);
		console.log("Logged out successfully.");
	  });
	}
  }

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
		  const matchId = [currentUser.uid, targetUid].sort().join('_');
		  currentMatchId = matchId;
		  getLiveMessages(matchId, targetUid);
	  } else if (route === 'messages' && !targetUid) {
		  renderConvoList();
	  }
	  
	  routeTo(route, true);
	});
	
	window.addEventListener('popstate', (e) => {
		const route = e.state?.route || 'home';
		routeTo(route, false);
	});
	
	// ✨ NEW FUNCTIONALITY: Back Button Logic
	backButtons.forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			const currentPage = $$('.page.is-visible')[0];
			if (currentPage) {
				// Add an exit animation class before navigating back
				currentPage.classList.add('slide-out-right');
				setTimeout(() => {
					window.history.back();
					currentPage.classList.remove('slide-out-right'); // Clean up the class
				}, 300); // Match this to your CSS transition speed
			} else {
				window.history.back();
			}
		});
	});
	// END NEW FUNCTIONALITY
  }
  
  function routeTo(routeName = "home", push = true) {
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
	
	if (routeName === 'messages' && !currentMatchId) {
		renderConvoList();
	} else if (routeName === 'messages' && currentMatchId) {
		// Chat page is already set up from data-target-uid
	}
	
	if (push) {
	  history.pushState({ route: routeName }, "", `#${routeName}`);
	}
  }

  /* =========================
   PROFILES — render & interactions
   ========================= */
  function loadNextProfile(fromRewind = false, profileToLoad = null) {
	if (!cardsContainer || !cardTemplate) return;
	
	// Remove the current card only if it's not a rewind
	const currentCard = safeQuery('.profile-card');
	if (currentCard) {
		currentCard.remove();
	}

	let nextProfile;
	if (fromRewind) {
		nextProfile = profileToLoad;
	} else {
		if (allProfiles.length === 0) {
			cardsContainer.innerHTML = `<div class="no-profiles">No new profiles nearby. Try changing your settings.</div>`;
			return;
		}
		nextProfile = allProfiles.shift();
	}
	
	renderSingleProfile(nextProfile);
  }

  function renderSingleProfile(profile) {
	if (!cardsContainer || !cardTemplate) return;
	
	const card = cardTemplate.content.cloneNode(true);
	const profileCardEl = card.querySelector(".profile-card");
	profileCardEl.setAttribute("data-uid", profile.uid);
	profileCardEl.setAttribute("data-profile-data", JSON.stringify(profile)); // Store profile data
	safeQuery(".profile-card__media img", card).src = profile.avatar;
	safeQuery(".profile-card__name", card).textContent = `${profile.name}, ${profile.age}`;
	safeQuery(".profile-card__metadata", card).textContent = `${profile.location.city} • ${Math.floor(Math.random() * 100) + 1} km away`;
	safeQuery(".profile-card__bio", card).textContent = profile.bio;
	
	cardsContainer.appendChild(card);
  }
  
  async function saveUserSwipe(targetUid, action) {
	console.log(`Simulated swipe: User ${currentUser.uid} swiped on ${targetUid} with action '${action}'`);
	// Mocking a match object structure
	const match = {
		users: [currentUser.uid, targetUid],
		lastMessage: null,
		status: action === 'like' ? 'pending' : 'skipped'
	};
	
	// Check if a match already exists for these two users
	let existingMatchIndex = db.matches.findIndex(m => m.users.includes(currentUser.uid) && m.users.includes(targetUid));
	if (existingMatchIndex === -1) {
		db.matches.push(match);
	} else {
		db.matches[existingMatchIndex].status = action === 'like' ? 'pending' : 'skipped';
	}
  }

  function checkForMatch(targetUid) {
	const otherUserMatchIndex = db.matches.findIndex(m => m.users.includes(targetUid) && m.users.includes(currentUser.uid) && m.status === 'pending');
	return otherUserMatchIndex !== -1;
  }

  function createMatch(targetUid) {
	const existingMatchIndex = db.matches.findIndex(m => m.users.includes(currentUser.uid) && m.users.includes(targetUid));
	if (existingMatchIndex !== -1) {
	  db.matches[existingMatchIndex].status = 'matched';
	  alert("It's a Match! 🎉");
	}
  }

  // ✨ ANIMATION LOGIC: Card Animation
  async function animateCardSwipe(card, action) {
	const animationClass = action === 'like' ? 'swipe-right' : 'swipe-left';
	card.classList.add(animationClass);
	
	// Wait for the animation to finish
	return new Promise(resolve => {
		card.addEventListener('animationend', () => {
			card.classList.remove(animationClass); // Clean up
			resolve();
		}, { once: true });
	});
  }
  
  function bindCardActions() {
	if (!cardsContainer) return;
	cardsContainer.addEventListener("click", async ev => {
	  const btn = ev.target.closest("button[data-action]");
	  if (!btn) return;
	  const action = btn.getAttribute("data-action");
	  const card = safeQuery(".profile-card"); // Always target the top card
	  if (!card) return;
	  
	  const targetUid = card.getAttribute("data-uid");
	  const profileData = JSON.parse(card.getAttribute("data-profile-data"));
	  
	  if (action === "skip" || action === "like") {
		// Record card data before removing it
		swipedCardsHistory.push(profileData);

		// Trigger the animation and wait for it to complete
		const swipeAction = action === "skip" ? "dislike" : "like";
		await animateCardSwipe(card, swipeAction);

		await saveUserSwipe(targetUid, action);
		if (action === "like") {
		  if (checkForMatch(targetUid)) {
			createMatch(targetUid);
		  }
		}
		loadNextProfile();
	  } else if (action === "rewind") {
		// ✨ NEW FUNCTIONALITY: Rewind
		if (swipedCardsHistory.length === 0) {
			showConfirmationToast("Nothing to rewind! Keep swiping.");
			return;
		}
		
		const lastCard = swipedCardsHistory.pop();
		card.remove(); // Remove the current card before loading the last one
		loadNextProfile(true, lastCard);
		showConfirmationToast(`${lastCard.name} is back!`);
		// END NEW FUNCTIONALITY
	  } else if (action === "super-like") {
		// ✨ NEW FUNCTIONALITY: Super Like (opens chat compose)
		const targetProfile = fetchUserProfile(targetUid);
		if (!targetProfile) return;
		
		// Simulate a "Super Like" match and open the chat
		createMatch(targetUid); // Instant match for super-like
		
		const matchId = [currentUser.uid, targetUid].sort().join('_');
		currentMatchId = matchId;
		getLiveMessages(matchId, targetUid);
		routeTo("messages", true);
		// END NEW FUNCTIONALITY
	  }
	});
  }
  // END ANIMATION LOGIC

  /* =========================
   MESSAGING (Mocked)
   ========================= */
  function renderConvoList() {
	if (!convoList) return;
	convoList.innerHTML = '';
	
	const matchedProfiles = db.matches
		.filter(m => m.users.includes(currentUser.uid) && m.status === 'matched')
		.map(m => {
			const otherUserUid = m.users.find(uid => uid !== currentUser.uid);
			const profile = fetchUserProfile(otherUserUid);
			return {
				...m,
				otherUserUid: otherUserUid,
				profile: profile
			};
		});

	for (const match of matchedProfiles) {
	  const convo = convoTemplate.content.cloneNode(true);
	  const link = convo.querySelector('.convo');
	  link.setAttribute('data-target-uid', match.otherUserUid);
	  safeQuery('.convo__avatar', convo).src = match.profile.avatar;
	  safeQuery('.convo__name', convo).textContent = match.profile.name;
	  safeQuery('.convo__last', convo).textContent = match.lastMessage || 'Start a conversation!';
	  convoList.appendChild(convo);
	}
  }

  function getLiveMessages(matchId, targetUid) {
	if (!chatBody) return;
	
	chatBody.innerHTML = '';
	safeQuery('.chat').style.display = 'grid';
	
	const profile = fetchUserProfile(targetUid);
	if (profile && chatHeader) {
	  chatHeader.querySelector('.chat__peer-name').textContent = profile.name;
	}
	
	const messages = db.messages[matchId] || [];
	messages.forEach(msg => renderSingleMessage(msg));
	chatBody.scrollTop = chatBody.scrollHeight;
  }

  function renderSingleMessage(msg) {
	if (!chatBody) return;
	const isMe = msg.senderId === currentUser.uid;
	const template = isMe ? messageTemplateMe : messageTemplateThem;
	const bubble = template.content.cloneNode(true);
	safeQuery('.bubble__text', bubble).textContent = msg.text;
	const time = new Date(msg.timestamp);
	safeQuery('time', bubble).textContent = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
			  timestamp: Date.now()
		  };
		  
		  if (!db.messages[currentMatchId]) {
			  db.messages[currentMatchId] = [];
		  }
		  db.messages[currentMatchId].push(message);

		  const match = db.matches.find(m => {
			const otherUserId = currentMatchId.split('_').find(id => id !== currentUser.uid);
			return m.users.includes(currentUser.uid) && m.users.includes(otherUserId);
		  });

		  if (match) {
			match.lastMessage = text;
		  }

		  renderSingleMessage(message);
		  messageInput.value = '';
		  chatBody.scrollTop = chatBody.scrollHeight;
	  });
  }

  /* =========================
   DISCOVERY SETTINGS
   ========================= */
   function bindDiscoverySettings() {
	// ✨ NEW FUNCTIONALITY: Range Slider Logic
	if (distanceSlider && distanceValue) {
		const updateDistance = () => {
			distanceValue.textContent = `${distanceSlider.value} km`;
			currentUser.settings.distance = parseInt(distanceSlider.value);
		};
		distanceSlider.addEventListener('input', updateDistance);
		// Initial setup
		distanceSlider.value = currentUser.settings.distance || 50;
		updateDistance();
	}
	
	if (ageMinSlider && ageMaxSlider && ageValue) {
		const updateAgeRange = () => {
			let minAge = parseInt(ageMinSlider.value);
			let maxAge = parseInt(ageMaxSlider.value);

			if (minAge > maxAge) {
				// Prevent min from passing max and vice versa
				if (event.target.id === 'settings-age-min') {
					maxAge = minAge;
					ageMaxSlider.value = minAge;
				} else {
					minAge = maxAge;
					ageMinSlider.value = maxAge;
				}
			}
			
			ageValue.textContent = `${minAge} - ${maxAge}`;
			currentUser.settings.ageRange = [minAge, maxAge];
		};

		ageMinSlider.addEventListener('input', updateAgeRange);
		ageMaxSlider.addEventListener('input', updateAgeRange);
		
		// Initial setup
		ageMinSlider.value = currentUser.settings.ageRange?.[0] || 18;
		ageMaxSlider.value = currentUser.settings.ageRange?.[1] || 30;
		updateAgeRange();
	}
	
	// ✨ NEW FUNCTIONALITY: Hide Account Toggle
	if (hideAccountSwitch) {
		hideAccountSwitch.checked = currentUser.settings.hideAccount || false;
		hideAccountSwitch.addEventListener('change', (e) => {
			currentUser.settings.hideAccount = e.target.checked;
			showConfirmationToast(`Account is now ${e.target.checked ? 'Hidden' : 'Visible'}!`);
		});
	}
	
	// ✨ NEW FUNCTIONALITY: Save Button (The form submit is the save)
	if (discoverySettingsForm) {
		discoverySettingsForm.addEventListener('submit', (e) => {
			e.preventDefault();
			// Since all changes are updated on 'input' and 'change' events,
			// we just need to confirm the save action.
			saveUserProfile(currentUser);
			showConfirmationToast("Discovery Settings Saved!");
		});
	}
	// END DISCOVERY SETTINGS
   }

  /* =========================
   UI Render
   ========================= */
  function renderProfilePage(profile) {
	// This function now uses the updated currentUser.settings from the settings page
	if (!profile) return;
	if (profileHeaderName) profileHeaderName.textContent = `${profile.name}, ${profile.age}`;
	if (profileHeaderBio) profileHeaderBio.textContent = `${profile.location?.city || "Unknown"} • ${profile.bio || "No bio yet."}`;
	if (profileHeaderAvatar) profileHeaderAvatar.src = profile.avatar;
	if (navAvatar) navAvatar.src = profile.avatar;
	
	renderPhotoGallery(profile.photos);
	renderInterests(profile.interests);
  }

  function renderPhotoGallery(photos) {
	if (!photoGallery) return;
	photoGallery.innerHTML = '';
	if (photos && photos.length > 0) {
		photoPlaceholder.hidden = true;
		photos.forEach(url => {
			const photoItem = document.createElement('div');
			photoItem.className = 'photo-item';
			photoItem.innerHTML = `<img src="${url}" alt="Profile photo">`;
			photoGallery.appendChild(photoItem);
		});
	} else {
		photoPlaceholder.hidden = false;
	}
  }

  function renderInterests(interests) {
	const interestsContainer = $('#profile-interests');
	if (!interestsContainer) return;
	interestsContainer.innerHTML = '';
	if (interests && interests.length > 0) {
		interests.forEach(interest => {
			const tag = document.createElement('span');
			tag.className = 'interest-tag';
			tag.textContent = interest;
			interestsContainer.appendChild(tag);
		});
	}
  }
  
  /* =========================
   Profile Management (Mocked)
   ========================= */
  function bindProfileManagement() {
	if (editProfileBtn) {
	  editProfileBtn.addEventListener("click", () => {
		routeTo("profile-edit", true);
	  });
	}

	if (shareProfileBtn) {
		// ✨ NEW FUNCTIONALITY: Share Profile URL
		shareProfileBtn.addEventListener("click", async () => {
			const shareUrl = `${window.location.origin}/#profile/${currentUser.uid}`;
			if (navigator.share) {
				try {
					await navigator.share({
						title: `${currentUser.name}'s Profile`,
						text: `Check out ${currentUser.name}'s profile on DateMe!`,
						url: shareUrl,
					});
					console.log('Profile shared successfully');
				} catch (error) {
					console.error('Error sharing:', error);
				}
			} else {
				navigator.clipboard.writeText(shareUrl).then(() => {
					showConfirmationToast("Profile link copied to clipboard!");
				});
			}
		});
		// END NEW FUNCTIONALITY
	}
	
	if (photoUploadInput) {
	  photoUploadInput.addEventListener("change", async (e) => {
		const files = Array.from(e.target.files);
		for (const file of files) {
		  if (file.size > 2 * 1024 * 1024) {
			alert("Image must be smaller than 2MB.");
			continue;
		  }
		  // In a real app, this would be an upload URL, but we use the local URL for preview
		  const localUrl = URL.createObjectURL(file); 
		  const photoId = `photo-${Date.now()}`;
		  const preview = createPhotoPreview(localUrl, photoId);
		  photoPreviewGrid.appendChild(preview);
		}
	  });
	}
	
	if (photoPreviewGrid) {
		photoPreviewGrid.addEventListener('click', (e) => {
			if (e.target.classList.contains('remove-btn')) {
				const preview = e.target.closest('.photo-preview');
				if (preview) {
					// NOTE: In the mock, we remove from the DOM but the final save will only take photos in the DOM
					preview.remove(); 
					console.log("Simulated photo removal.");
				}
			}
		});
	}
	
	function createPhotoPreview(url, id) {
		const div = document.createElement('div');
		div.className = 'photo-preview';
		div.setAttribute('data-photo-id', id);
		div.innerHTML = `
			<img src="${url}" alt="Photo preview">
			<button class="remove-btn" type="button">&times;</button>
		`;
		return div;
	}

	if (profileForm) {
	  // ✨ NEW FUNCTIONALITY: Profile Edit Save
	  profileForm.addEventListener("submit", async e => {
		e.preventDefault();
		
		const updatedProfile = {
		  ...currentUser,
		  name: profileForm.querySelector("#profile-name").value,
		  age: parseInt(profileForm.querySelector("#profile-age").value),
		  bio: profileForm.querySelector("#profile-bio").value,
		  gender: profileForm.querySelector("#profile-gender").value,
		  interests: profileForm.querySelector("#profile-interests-input").value.split(",").map(i => i.trim()).filter(i => i),
		};
		
		// Grab the current set of photos from the preview grid DOM elements
		const newPhotos = Array.from(photoPreviewGrid.querySelectorAll('img')).map(img => img.src);
		updatedProfile.photos = newPhotos;

		saveUserProfile(updatedProfile);
		renderProfilePage(currentUser); // Rerender the profile page with new data
		showConfirmationToast("Profile Updated! See your new look.");
		routeTo("profile", true);
	  });
	  // END NEW FUNCTIONALITY
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
	
	// ✨ NEW FUNCTIONALITY: Search Bar Logic
	const searchIcon = $('[data-action="open-search"]');
	if (searchIcon) {
		searchIcon.addEventListener('click', () => {
			searchBarContainer.classList.toggle('is-visible');
			if (searchBarContainer.classList.contains('is-visible')) {
				searchInput.focus();
			} else {
				searchInput.value = '';
				if (searchResultsContainer) searchResultsContainer.innerHTML = '';
			}
		});
	}
	
	if (searchInput) {
		searchInput.addEventListener('input', (e) => {
			const query = e.target.value.toLowerCase();
			if (!searchResultsContainer) return;
			searchResultsContainer.innerHTML = '';
			
			if (query.length > 0) {
				const results = db.profiles.filter(p => p.name && p.name.toLowerCase().includes(query));
				
				if (results.length > 0) {
					results.forEach(p => {
						const li = document.createElement('li');
						li.innerHTML = `<a href="#profile/${p.uid}" data-route-link="profile" data-target-uid="${p.uid}">${p.name} (${p.age})</a>`;
						searchResultsContainer.appendChild(li);
					});
				} else {
					searchResultsContainer.innerHTML = '<li>No names found.</li>';
				}
			}
		});
	}
	// END NEW FUNCTIONALITY

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
	
	// ✨ NEW FUNCTIONALITY: Mobile Money Donation Flow
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
		  // Mock USSD for Airtel (example format)
		  ussd = `*211*1*1*0994426162*${amount}#`; 
		  alert(`Attempting to dial Airtel Money USSD for K${amount}. Follow your phone prompts: ${ussd}`);
		} else if (selectedProvider === "tnm") {
		  // Mock USSD for TNM (example format)
		  ussd = `*444*1*1*0889479863*${amount}#`; 
		  alert(`Attempting to dial TNM Mpamba USSD for K${amount}. Follow your phone prompts: ${ussd}`);
		}
		
		if (ussd) {
		  // Use the tel: scheme to launch the phone dialer
		  window.location.href = `tel:${encodeURIComponent(ussd)}`;
		} else {
		  alert("Please select a mobile money provider.");
		}
		
		modalDonate.close();
	  });
	}
	// END NEW FUNCTIONALITY
  }

  /* =========================
   Init everything
   ========================= */
  async function init() {
	pages.forEach(p => p.hidden = true);
	
	// Check for existing user or create mock new user
	if (!currentUser) {
		currentUser = db.profiles.find(p => p.email === "newuser@example.com");
		if (!currentUser) {
			currentUser = {
				uid: "temp-new-user-" + Date.now(),
				email: "newuser@example.com",
				onboardingComplete: false,
				isSubscriber: false,
				settings: { gender: "all", distance: 50, ageRange: [18, 30], hideAccount: false },
			};
			db.profiles.push(currentUser);
		}
	}

	if (currentUser && currentUser.onboardingComplete) {
	  handleUserLogin(currentUser);
	} else {
	  routeTo("onboarding", false);
	}

	bindAuthForms();
	bindRouting();
	bindCardActions();
	bindProfileManagement();
	bindUI();
	bindMessageForm();
	bindDiscoverySettings(); // Initialize settings logic
  }

  document.addEventListener("DOMContentLoaded", () => init());

})();
