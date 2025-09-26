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
  function loadNextProfile() {
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
	safeQuery(".profile-card__distance", card).textContent = `${Math.floor(Math.random() * 100) + 1} km away`;
	
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
	  console.log(`Simulated match found with ${targetUid}!`);
	}
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
		await saveUserSwipe(targetUid, action);
		if (action === "like") {
		  if (checkForMatch(targetUid)) {
			createMatch(targetUid);
			alert("It's a Match! 🎉");
		  }
		}
		loadNextProfile();
	  } else if (action === "message") {
		const targetProfile = fetchUserProfile(targetUid);
		if (!targetProfile) {
			console.error("Target profile not found.");
			return;
		}
		
		const matchId = [currentUser.uid, targetUid].sort().join('_');
		currentMatchId = matchId;
		getLiveMessages(matchId, targetUid);
		routeTo("messages", true);
	  }
	});
  }

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
			const [user1, user2] = m.users;
			return (user1 === currentUser.uid && user2 === currentMatchId.split('_').find(id => id !== currentUser.uid)) ||
				   (user2 === currentUser.uid && user1 === currentMatchId.split('_').find(id => id !== currentUser.uid));
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
   UI Render
   ========================= */
  function renderProfilePage(profile) {
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
			const img = document.createElement('img');
			img.src = url;
			photoGallery.appendChild(img);
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
		shareProfileBtn.addEventListener("click", async () => {
			if (navigator.share) {
				try {
					await navigator.share({
						title: `${currentUser.name}'s Profile`,
						text: `Check out ${currentUser.name}'s profile on DateMe!`,
						url: window.location.href,
					});
					console.log('Profile shared successfully');
				} catch (error) {
					console.error('Error sharing:', error);
				}
			} else {
				navigator.clipboard.writeText(window.location.href).then(() => {
					alert("Profile link copied to clipboard!");
				});
			}
		});
	}
	
	if (photoUploadInput) {
	  photoUploadInput.addEventListener("change", async (e) => {
		const files = Array.from(e.target.files);
		for (const file of files) {
		  if (file.size > 2 * 1024 * 1024) {
			alert("Image must be smaller than 2MB.");
			continue;
		  }
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
					const photoId = preview.getAttribute('data-photo-id');
					const photoIndex = currentUser.photos.findIndex(url => url.includes(photoId));
					if (photoIndex !== -1) {
					  currentUser.photos.splice(photoIndex, 1);
					}
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
	  profileForm.addEventListener("submit", async e => {
		e.preventDefault();
		
		const updatedProfile = {
		  ...currentUser,
		  name: profileForm.querySelector("#profile-name").value,
		  age: parseInt(profileForm.querySelector("#profile-age").value),
		  bio: profileForm.querySelector("#profile-bio").value,
		  gender: profileForm.querySelector("#profile-gender").value,
		  interests: profileForm.querySelector("#profile-interests-input").value.split(",").map(i => i.trim()).filter(i => i),
		  photos: [...currentUser.photos] // Shallow copy
		};
		
		// Grab photos from the preview grid
		const newPhotos = Array.from(photoPreviewGrid.querySelectorAll('img')).map(img => img.src);
		updatedProfile.photos = newPhotos;

		saveUserProfile(updatedProfile);
		renderProfilePage(currentUser);
		alert("Profile saved successfully!");
		routeTo("profile", true);
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
		  ussd = `*211*1*1*0994426162*${amount}#`;
		} else if (selectedProvider === "tnm") {
		  ussd = `*444*1*1*0889479863*${amount}#`;
		}
		
		if (ussd) {
		  window.location.href = `tel:${ussd}`;
		} else {
		  alert("Please select a mobile money provider.");
		}
		
		modalDonate.close();
	  });
	}
  }

  /* =========================
   Init everything
   ========================= */
  async function init() {
	pages.forEach(p => p.hidden = true);
	
	// Create a new, temporary user profile to simulate a fresh signup
	currentUser = {
	  uid: "temp-new-user-" + Date.now(),
	  email: "newuser@example.com",
	  onboardingComplete: false,
	  isSubscriber: false,
	  settings: { gender: "all", distance: 50, ageRange: [18, 30], hideAccount: false },
	};

	// Add this new user to our mock database
	db.profiles.push(currentUser);

	// Now, go directly to the onboarding page
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
  }

  document.addEventListener("DOMContentLoaded", () => init());

})();

  document.addEventListener("DOMContentLoaded", () => init());

})();