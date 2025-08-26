// app.js — DateMe interactive logic (rewritten, robust)
// IIFE to avoid polluting global scope
(() => {
  "use strict";

  /* =========================
	 Demo profile dataset
	 ========================= */
  const profiles = [
    {
      id: "anna",
      name: "Anna",
      age: 28,
      location: "Blantyre",
      interests: ["Music", "Hiking"],
      bio: "Curious, coffee lover, and weekend hiker. Looking for someone to laugh with.",
      avatar: "https://placehold.co/600x400?text=Anna",
      photos: ["https://placehold.co/240x240?text=Anna+1", "https://placehold.co/240x240?text=Anna+2", "https://placehold.co/240x240?text=Anna+3"]
    },
    {
      id: "john",
      name: "John",
      age: 30,
      location: "Lilongwe",
      interests: ["Tech", "Football"],
      bio: "Frontend dev, part-time chef. I’ll cook, you pick the playlist.",
      avatar: "https://placehold.co/600x400?text=John",
      photos: ["https://placehold.co/240x240?text=John+1", "https://placehold.co/240x240?text=John+2"]
    },
    {
      id: "mike",
      name: "Mike",
      age: 27,
      location: "Mzuzu",
      interests: ["Fitness", "Gaming"],
      bio: "Gym rat, gamer, and pizza enthusiast.",
      avatar: "https://placehold.co/600x400?text=Mike",
      photos: ["https://placehold.co/240x240?text=Mike+1"]
    },
    {
      id: "sophia",
      name: "Sophia",
      age: 29,
      location: "Lilongwe",
      interests: ["Art", "Coffee"],
      bio: "Artist with a love for cappuccinos and deep talks.",
      avatar: "https://placehold.co/600x400?text=Sophia",
      photos: ["https://placehold.co/240x240?text=Sophia+1", "https://placehold.co/240x240?text=Sophia+2"]
    }
  ];

  const profileMap = profiles.reduce((map, p) => {
    map[p.id] = p;
    return map;
  }, {});

  /* =========================
	 Mock API (simulates back-end data fetching)
	 ========================= */
  const mockApi = {
    getProfiles: async () => {
      await sleep(400); // Simulate network delay
      // Return profiles in a random order to simulate new discoveries
      return profiles.sort(() => Math.random() - 0.5);
    },
    getProfile: async (id) => {
      await sleep(200);
      return profileMap[id] || null;
    },
    getMatches: async () => {
      await sleep(300);
      return [profileMap.anna, profileMap.john];
    },
    getMessages: async (convoId) => {
      await sleep(200);
      const messages = {
        'anna': [
          { who: "them", text: "Hi! How are you?", time: formatTime(new Date(Date.now() - 1000 * 60 * 20)) },
          { who: "me", text: "I’m good, thanks! How about you?", time: formatTime(new Date(Date.now() - 1000 * 60 * 18)) }
        ],
        'john': [
          { who: "them", text: "Hey! What's up?", time: formatTime(new Date(Date.now() - 1000 * 60 * 30)) },
          { who: "me", text: "Not much, just coding. You?", time: formatTime(new Date(Date.now() - 1000 * 60 * 25)) }
        ]
      };
      return messages[convoId] || [];
    },
    sendMessage: async (convoId, text) => {
      await sleep(150);
      const message = {
        who: "me",
        text: text,
        time: formatTime()
      };
      return message;
    },
    saveProfile: async (profileData) => {
      await sleep(400);
      console.log("Mock API: Saving profile data:", profileData);
      return { success: true, message: "Profile updated successfully!" };
    },
    // NEW: Mock API for subscribing
    subscribe: async () => {
      await sleep(800);
      return { success: true, message: "Subscription successful!" };
    },
    // NEW: Mock API for sending gifts
    sendGift: async (recipientId) => {
      await sleep(600);
      console.log(`Mock API: Sending gift to ${recipientId}`);
      return { success: true, message: "Gift sent successfully!" };
    }
  };

  /* =========================
	 Helper utilities
	 ========================= */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const safeQuery = (sel, ctx = document) => {
    try { return ctx.querySelector(sel); }
    catch (e) { return null; }
  };

  const createElFromHTML = htmlStr => {
    const tpl = document.createElement("template");
    tpl.innerHTML = htmlStr.trim();
    return tpl.content.firstElementChild;
  };

  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* =========================
	 DOM cache
	 ========================= */
  const body = document.body;
  const themeSwitch = safeQuery("#theme-switch");
  const navLinks = $$("[data-route-link]");
  const pages = $$(".page");
  const pageMap = pages.reduce((m, p) => {
    const name = p.getAttribute("data-route");
    if (name) m[name] = p;
    return m;
  }, {});
  const cardsContainer = safeQuery(".cards");
  const cardTemplate = document.getElementById("template-profile-card");
  const badgeMessages = safeQuery("#badge-messages");
  const badgeNotifs = safeQuery("#badge-notifs");
  const convoList = safeQuery(".convo-list");
  const chatBody = safeQuery(".chat__body");
  const typingIndicator = safeQuery("[data-typing]");
  const chatComposer = safeQuery(".chat__composer");
  const avatarBtn = safeQuery(".avatar-btn");
  const userMenu = safeQuery("#menu-user");
  const editProfileBtn = safeQuery("[data-action='edit-profile']");
  const modalEdit = safeQuery("#modal-edit-profile");
  const footerYear = safeQuery("[data-year]");
  const chatPeerName = safeQuery(".chat__name");
  const chatPeerAvatar = safeQuery(".chat__peer img");
  const profileAboutPanel = safeQuery("#tab-about");
  const profileInterestsPanel = safeQuery("#tab-interests");
  const profilePhotosPanel = safeQuery("#tab-photos");
  const profilePhotoGrid = safeQuery(".photo-grid");
  const profileHeaderName = safeQuery("#profile-title");
  const profileHeaderBio = safeQuery(".profile-header__info p");
  const profileHeaderAvatar = safeQuery(".profile-header__media img");
  const modalEditForm = safeQuery("#modal-edit-profile form");
  // NEW: Dom caches for modals and buttons
  const modalSubscribe = safeQuery("#modal-subscribe");
  const modalGift = safeQuery("#modal-gift");
  const discoverSettingsBtn = safeQuery("#discover-settings-btn");
  const subscribeBtn = safeQuery("[data-action='subscribe']");
  const messagesPage = safeQuery("[data-route='messages']");
  const messagesSubscribePrompt = safeQuery(".messages-subscribe-prompt");
  // NEW: Chat specific DOM elements
  const moreMenuBtn = document.getElementById('chat-more-btn');
  const moreMenu = document.getElementById('chat-more-menu');
  const messageInput = document.getElementById('msg');
  const sendBtn = document.getElementById('send-message-btn');
  const micBtn = document.getElementById('send-voice-btn');
  const attachFileBtn = document.getElementById('attach-file-btn');


  /* =========================
	 State
	 ========================= */
  const state = {
    currentUser: {
      name: "Phillip",
      age: 20,
      location: "Lilongwe",
      bio: "Friendly and focused. Building a modern dating site with clean design and smooth UX.",
      avatar: "https://placehold.co/120x120?text=Phillip",
      interests: ["Design", "Tech", "Entrepreneurship", "Music"],
      photos: ["https://placehold.co/240x240?text=Phil+1", "https://placehold.co/240x240?text=Phil+2", "https://placehold.co/240x240?text=Phil+3"],
      isSubscriber: false // NEW: User subscription status
    },
    likes: new Set(),
    viewedProfiles: new Set(),
    matchHistory: new Set(),
    unreadMessages: 3,
    unreadNotifs: 1,
    currentConvo: "anna",
    theme: localStorage.getItem("dateme-theme") || (body.dataset.theme || "light"),
    profileQueue: [] // NEW: Queue of profiles to show
  };

  /* =========================
	 Initialize core things
	 ========================= */
  function init() {
    try {
      setInitialTheme();
      bindThemeSwitch();
      bindRouting();
      bindNavLinks();
      // REVISED: Call a new function to fetch and load the initial profile
      loadNextProfile();
      bindCardActions();
      bindConversations();
      bindChatComposer();
      bindAvatarMenu();
      bindProfileEditModal();
      bindTabs();
      updateBadges();
      setFooterYear();
      handlePopState();
      renderProfilePage();
      // NEW: Bind new modal and button actions
      bindModals();
      bindDiscoverySettings();
      // NEW: Bind messages specific actions
      bindMessagesActions();
      // NEW: Bind the new chat UI interactions
      bindChatUI();

      const initialRoute = location.hash ? location.hash.slice(1) : "home";
      routeTo(initialRoute, false);
      if (typingIndicator) typingIndicator.style.display = "none";
    } catch (err) {
      console.error("Init error:", err);
    }
  }

  /* =========================
	 THEME
	 ========================= */
  function setInitialTheme() {
    const storedTheme = localStorage.getItem("dateme-theme");
    if (storedTheme) {
      state.theme = storedTheme;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      state.theme = prefersDark ? "dark" : "light";
    }
    body.setAttribute("data-theme", state.theme);
    if (themeSwitch) themeSwitch.checked = (state.theme === "dark");
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem("dateme-theme")) {
        state.theme = e.matches ? "dark" : "light";
        body.setAttribute("data-theme", state.theme);
        if (themeSwitch) themeSwitch.checked = e.matches;
      }
    });
  }

  function bindThemeSwitch() {
    if (!themeSwitch) return;
    themeSwitch.addEventListener("change", (e) => {
      const dark = e.target.checked;
      body.setAttribute("data-theme", dark ? "dark" : "light");
      state.theme = dark ? "dark" : "light";
      localStorage.setItem("dateme-theme", state.theme);
      body.classList.add("theme-transition");
      window.setTimeout(() => body.classList.remove("theme-transition"), 350);
    });
  }

  /* =========================
	 ROUTING (simple SPA)
	 ========================= */
  function bindRouting() {
    document.addEventListener("click", (ev) => {
      const link = ev.target.closest("[data-route-link]");
      if (!link) return;
      ev.preventDefault();
      const route = link.getAttribute("data-route-link");
      if (!route) return;
      routeTo(route, true);
    });
  }

  function bindNavLinks() {
    navLinks.forEach(n => {
      n.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          n.click();
        }
      });
    });
  }

  function routeTo(routeName = "home", push = true) {
    pages.forEach(p => {
      p.classList.remove("is-visible");
      p.hidden = true;
    });

    const target = pageMap[routeName];
    if (!target) {
      console.warn("Unknown route:", routeName);
      routeTo("home", false);
      return;
    }

    target.classList.add("is-visible");
    target.hidden = false;

    const allNavLinks = $$('[data-route-link]');
    allNavLinks.forEach(n => {
      const r = n.getAttribute("data-route-link");
      if (r === routeName) {
        n.classList.add("is-active");
        n.setAttribute("aria-current", "page");
      } else {
        n.classList.remove("is-active");
        n.removeAttribute("aria-current");
      }
    });

    if (push) {
      try {
        history.pushState({ route: routeName }, "", `#${routeName}`);
      } catch (e) {}
    }

    if (routeName === "messages") {
      state.unreadMessages = 0;
      updateBadges();
      const activeConvoEl = convoList.querySelector('.convo.is-active');
      const convoId = activeConvoEl ? activeConvoEl.dataset.convo : 'anna';
      // NEW: Check subscription status to show or hide the composer/prompt
      if (state.currentUser.isSubscriber) {
        if (messagesSubscribePrompt) messagesSubscribePrompt.hidden = true;
        if (chatComposer) chatComposer.hidden = false;
      } else {
        if (messagesSubscribePrompt) messagesSubscribePrompt.hidden = false;
        if (chatComposer) chatComposer.hidden = true;
      }
      loadChatForConvo(convoId);
      // On messages page load, ensure the correct view is shown for desktop
      if (window.innerWidth >= 768) {
        showChatView();
      } else {
        showConvoList();
      }
    }
    if (routeName === "notifications") {
      state.unreadNotifs = 0;
      updateBadges();
    }
  }

  function handlePopState() {
    window.addEventListener("popstate", (e) => {
      const route = (e.state && e.state.route) || (location.hash && location.hash.slice(1)) || "home";
      routeTo(route, false);
    });
  }

  /* =========================
	 PROFILES — render & interactions
	 ========================= */
  async function loadNextProfile() {
    if (!cardsContainer || !cardTemplate) return;

    // Check if the queue is empty. If so, fetch more profiles.
    if (state.profileQueue.length === 0) {
      // Show a loading state on the cards container
      cardsContainer.innerHTML = `<div class="loading">Loading profiles...</div>`;
      const newProfiles = await mockApi.getProfiles();
      state.profileQueue = newProfiles;
      // If no profiles are found, show a message
      if (state.profileQueue.length === 0) {
        cardsContainer.innerHTML = `<div class="no-profiles">No new profiles nearby. Try changing your settings.</div>`;
        return;
      }
    }

    // Remove any existing card
    cardsContainer.innerHTML = '';
    // Get the next profile from the queue
    const profile = state.profileQueue.shift();
    // Render a single card
    renderSingleProfile(profile);
  }

  function renderSingleProfile(profile) {
    if (!cardsContainer || !cardTemplate || !profile) return;
    const clone = cardTemplate.content.firstElementChild.cloneNode(true);
    clone.setAttribute("data-profile-id", profile.id);
    const img = clone.querySelector(".profile-card__media img");
    if (img) img.src = profile.avatar;
    const title = clone.querySelector(".profile-card__title");
    if (title) title.innerHTML = `${profile.name} <span class="age">${profile.age}</span>`;
    const meta = clone.querySelector(".profile-card__meta");
    if (meta) meta.textContent = [profile.location, ...(profile.interests || [])].join(" • ");
    const bio = clone.querySelector(".profile-card__bio");
    if (bio) bio.textContent = profile.bio;
    cardsContainer.appendChild(clone);
  }

  function bindCardActions() {
    if (!cardsContainer) return;
    cardsContainer.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const card = btn.closest(".profile-card");
      if (!card) return;
      const profileId = card.getAttribute("data-profile-id");
      if (!profileId) return;

      if (card.classList.contains('is-animating')) return;
      card.classList.add('is-animating');

      if (action === "like") {
        await animateCardSwipe(card, "right");
        await handleLike(profileId);
        loadNextProfile(); // Load next profile after swipe
      } else if (action === "skip") {
        await animateCardSwipe(card, "left");
        await handleSkip(profileId);
        loadNextProfile(); // Load next profile after swipe
      } else if (action === "gift") {
        // NEW: Show gift modal
        if (modalGift) {
          modalGift.setAttribute("data-recipient-id", profileId);
          if (typeof modalGift.showModal === "function") modalGift.showModal();
          else modalGift.removeAttribute("hidden");
        }
        card.classList.remove('is-animating');
      }
    });
  }

  async function animateCardSwipe(cardEl, dir = "right") {
    if (!cardEl) return;
    cardEl.style.transition = "transform .42s cubic-bezier(.22,1,.36,1), opacity .32s linear";
    const offX = dir === "right" ? 320 : -320;
    const rot = dir === "right" ? 12 : -12;
    cardEl.style.transform = `translateX(${offX}px) rotate(${rot}deg)`;
    cardEl.style.opacity = "0";
    await sleep(420);
    if (cardEl.parentElement) cardEl.parentElement.removeChild(cardEl);
  }

  async function handleLike(profileId) {
    state.likes.add(profileId);
    state.viewedProfiles.add(profileId);
    const likedBack = (profileId === "anna" || profileId === "john");
    if (likedBack) {
      const profile = await mockApi.getProfile(profileId);
      state.matchHistory.add(profileId);
      showMatchToast(profile);
      addToMatchesList(profile);
      state.unreadNotifs += 1;
      updateBadges();
    }
  }

  async function handleSkip(profileId) {
    state.viewedProfiles.add(profileId);
  }

  function addToMatchesList(profile) {
    const matchesPage = pageMap["matches"];
    if (!matchesPage) return;
    const list = matchesPage.querySelector(".match-list");
    if (!list) return;
    if (list.querySelector(`[data-user="${profile.id}"]`)) return;
    const li = document.createElement("li");
    li.className = "match";
    li.innerHTML = `
	  <img src="${profile.avatar}" alt="${profile.name}" class="match__avatar" />
	  <div class="match__body">
		<strong>${profile.name}, ${profile.age}</strong>
		<span class="match__meta">Matched just now</span>
	  </div>
	  <div class="match__actions">
		<button class="btn btn--ghost" data-action="view-profile" data-user="${profile.id}">View</button>
		<button class="btn btn--primary" data-route-link="messages" data-start-chat="${profile.id}">Message</button>
	  </div>
	`;
    list.prepend(li);
  }

  /* =========================
	 MATCH POPUP / TOAST
	 ========================= */
  function showMatchToast(profile) {
    const toast = createElFromHTML(`
	  <div class="match-toast">
		<strong>It's a match!</strong><span style="opacity:.95">${profile.name}</span>
	  </div>
	`);
    toast.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:24px;padding:14px 18px;border-radius:12px;background:linear-gradient(90deg,var(--brand),var(--brand-600));color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.3);z-index:2000;display:flex;gap:12px;align-items:center;opacity:0;transition:opacity .3s ease, transform .3s ease;";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 10);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(12px)";
    }, 2200);
    setTimeout(() => toast.remove(), 2600);
  }

  /* =========================
	 BADGES, NOTIFS
	 ========================= */
  function updateBadges() {
    if (badgeMessages) {
      badgeMessages.textContent = state.unreadMessages > 0 ? String(state.unreadMessages) : "";
      badgeMessages.style.display = state.unreadMessages > 0 ? "inline-grid" : "none";
    }
    if (badgeNotifs) {
      badgeNotifs.style.display = state.unreadNotifs > 0 ? "inline-grid" : "none";
    }
  }

  /* =========================
	 MESSAGES / CONVERSATIONS
	 ========================= */
  function showChatView() {
    if (messagesPage) {
      const convoList = messagesPage.querySelector(".convos");
      const chatSection = messagesPage.querySelector(".chat");
      if (convoList) convoList.hidden = true;
      if (chatSection) chatSection.style.display = "grid";
    }
  }

  function showConvoList() {
    if (messagesPage) {
      const convoList = messagesPage.querySelector(".convos");
      const chatSection = messagesPage.querySelector(".chat");
      if (convoList) convoList.hidden = false;
      if (chatSection) chatSection.style.display = "none";
    }
  }

  function bindMessagesActions() {
    if (messagesPage) {
      const chatBackBtn = messagesPage.querySelector("[data-action='chat-back']");
      if (chatBackBtn) {
        chatBackBtn.addEventListener('click', () => {
          showConvoList();
        });
      }
    }
  }
  
  // NEW FUNCTION: Bind new chat UI elements
  function bindChatUI() {
    // Toggle the three-dots menu
    if (moreMenuBtn && moreMenu) {
      moreMenuBtn.addEventListener('click', () => {
        const isExpanded = moreMenuBtn.getAttribute('aria-expanded') === 'true';
        moreMenuBtn.setAttribute('aria-expanded', !isExpanded);
        moreMenu.hidden = isExpanded;
      });

      // Hide menu when clicking outside
      document.addEventListener('click', (event) => {
        if (!moreMenuBtn.contains(event.target) && !moreMenu.contains(event.target)) {
          moreMenu.hidden = true;
          moreMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Handle menu options
    if (moreMenu) {
      moreMenu.addEventListener('click', (event) => {
        const action = event.target.dataset.action;
        const user = state.currentConvo;
        if (!user) return; // Exit if no user is selected

        switch (action) {
          case 'block':
            alert(`User "${user}" has been blocked.`);
            break;
          case 'mute':
            alert(`Notifications for "${user}" have been muted.`);
            break;
          case 'view-profile':
            // In a real app, this would route to a user profile page.
            alert(`Navigating to profile for "${user}".`);
            break;
        }
        moreMenu.hidden = true; // Hide the menu after an action
        moreMenuBtn.setAttribute('aria-expanded', 'false');
      });
    }

    // Toggle between mic and send button
    if (messageInput && sendBtn && micBtn) {
      // Initially show mic button
      sendBtn.style.display = 'none';
      micBtn.style.display = 'inline-flex';

      messageInput.addEventListener('input', () => {
        if (messageInput.value.trim().length > 0) {
          sendBtn.style.display = 'inline-flex';
          micBtn.style.display = 'none';
        } else {
          sendBtn.style.display = 'none';
          micBtn.style.display = 'inline-flex';
        }
      });
    }

    // Placeholder actions for mic and file buttons
    if (attachFileBtn) {
      attachFileBtn.addEventListener('click', () => {
        alert('File picker would open here.');
      });
    }

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        alert('Recording voice message...');
      });
    }
  }

  function bindConversations() {
    if (!convoList) return;
    convoList.addEventListener("click", (ev) => {
      const li = ev.target.closest(".convo");
      if (!li) return;
      convoList.querySelectorAll(".convo").forEach(c => c.classList.remove("is-active"));
      li.classList.add("is-active");
      const b = li.querySelector(".badge");
      if (b) b.remove();
      const convoId = li.dataset.convo;
      state.currentConvo = convoId;
      loadChatForConvo(convoId);

      // New: On mobile, clicking a conversation shows the chat view
      if (window.innerWidth < 768) {
        showChatView();
      }
    });

    document.addEventListener("click", (ev) => {
      const startBtn = ev.target.closest("[data-start-chat]");
      if (!startBtn) return;
      const id = startBtn.getAttribute("data-start-chat");
      const convoEl = convoList.querySelector(`[data-convo="${id}"]`);
      if (convoEl) convoEl.click();
      routeTo("messages", true);
    });
  }

  async function loadChatForConvo(convoId) {
    if (!chatBody || !chatPeerName || !chatPeerAvatar) return;

    const user = await mockApi.getProfile(convoId);
    if (!user) {
      console.warn('Profile not found for convoId:', convoId);
      return;
    }

    chatPeerName.textContent = user.name;
    chatPeerAvatar.src = user.avatar;
    chatPeerAvatar.alt = user.name;

    chatBody.innerHTML = '';

    const messagesToDisplay = await mockApi.getMessages(convoId);
    messagesToDisplay.forEach(m => {
      const node = document.createElement("div");
      node.className = `bubble ${m.who === "me" ? "bubble--me" : "bubble--them"}`;
      node.innerHTML = `<p>${escapeHtml(m.text)}</p><time>${m.time}</time>`;
      chatBody.appendChild(node);
    });

    if (typingIndicator) {
      chatBody.appendChild(typingIndicator);
      typingIndicator.style.display = "none";
    }
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    if (!chatBody) return;
    chatBody.scrollTop = chatBody.scrollHeight + 120;
  }

  function bindChatComposer() {
    if (!chatComposer) return;
    const input = chatComposer.querySelector("input[name='message']");
    if (!input) return;
    chatComposer.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const message = input.value.trim();
      if (message) {
        const sentMessage = await mockApi.sendMessage(state.currentConvo, message);
        const bubble = document.createElement("div");
        bubble.className = "bubble bubble--me";
        bubble.innerHTML = `<p>${escapeHtml(sentMessage.text)}</p><time>${sentMessage.time}</time>`;
        if (typingIndicator && typingIndicator.parentElement === chatBody) {
          chatBody.insertBefore(bubble, typingIndicator);
        } else {
          chatBody.appendChild(bubble);
        }
        scrollChatToBottom();
        input.value = "";
        // Toggle back to mic button
        if (sendBtn) sendBtn.style.display = 'none';
        if (micBtn) micBtn.style.display = 'inline-flex';

        simulateReply();
      }
    });
  }

  async function simulateReply() {
    if (!typingIndicator || !chatBody) return;
    typingIndicator.style.display = "inline-flex";
    await sleep(900 + Math.random() * 1400);
    const reply = createElFromHTML(`<div class="bubble bubble--them"><p>Got it!</p><time>${formatTime()}</time></div>`);
    chatBody.insertBefore(reply, typingIndicator);
    typingIndicator.style.display = "none";
    scrollChatToBottom();
    if (!pageMap["messages"].classList.contains("is-visible")) {
      state.unreadMessages += 1;
      updateBadges();
    }
  }

  /* =========================
	 AVATAR MENU & PROFILE EDIT
	 ========================= */
  function bindAvatarMenu() {
    if (!avatarBtn || !userMenu) return;
    avatarBtn.addEventListener("click", () => {
      const expanded = avatarBtn.getAttribute("aria-expanded") === "true";
      avatarBtn.setAttribute("aria-expanded", String(!expanded));
      userMenu.toggleAttribute("hidden");
    });
    userMenu.addEventListener("click", (ev) => {
      const logoutBtn = ev.target.closest("[data-action='logout']");
      if (logoutBtn) {
        ev.preventDefault();
        alert("Logged out! (This is a demo)");
        userMenu.setAttribute("hidden", "");
        avatarBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (ev) => {
      if (!avatarBtn.contains(ev.target) && !userMenu.contains(ev.target)) {
        if (!userMenu.hasAttribute("hidden")) userMenu.setAttribute("hidden", "");
        avatarBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function bindProfileEditModal() {
    if (!editProfileBtn || !modalEdit) return;
    editProfileBtn.addEventListener("click", () => {
      const nameInput = modalEdit.querySelector('input[type="text"]');
      const bioTextarea = modalEdit.querySelector('textarea');
      if (nameInput) nameInput.value = state.currentUser.name;
      if (bioTextarea) bioTextarea.value = state.currentUser.bio;
      
      if (typeof modalEdit.showModal === "function") modalEdit.showModal();
      else modalEdit.removeAttribute("hidden");
    });

    if (modalEditForm) {
      modalEditForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const nameInput = modalEditForm.querySelector('input[type="text"]');
        const bioTextarea = modalEditForm.querySelector('textarea');
        const newProfileData = {
          ...state.currentUser,
          name: nameInput.value,
          bio: bioTextarea.value
        };

        const saveBtn = modalEditForm.querySelector('button[type="submit"]');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        try {
          const result = await mockApi.saveProfile(newProfileData);
          if (result.success) {
            state.currentUser = newProfileData;
            renderProfilePage();
            alert(result.message);
            modalEdit.close();
          }
        } catch (e) {
          alert("Failed to save profile. Please try again.");
        } finally {
          saveBtn.textContent = 'Save';
          saveBtn.disabled = false;
        }
      });
    }
  }

  /* =========================
	 TABS (profile page)
	 ========================= */
  function bindTabs() {
    const tabs = $$(".tab");
    const panels = $$(".tab-panel");
    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetId = tab.getAttribute("aria-controls");
        tabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        panels.forEach(p => {
          if (p.id === targetId) {
            p.classList.add("is-visible");
            p.hidden = false;
          } else {
            p.classList.remove("is-visible");
            p.hidden = true;
          }
        });
        if (targetId === 'tab-interests') renderInterests();
        if (targetId === 'tab-photos') renderPhotos();
      });
    });
  }

  /* =========================
	 Profile Page Rendering
	 ========================= */
  function renderProfilePage() {
    if (profileHeaderName) profileHeaderName.textContent = `${state.currentUser.name}, ${state.currentUser.age}`;
    if (profileHeaderBio) profileHeaderBio.textContent = `${state.currentUser.location} • ${state.currentUser.bio}`;
    if (profileHeaderAvatar) profileHeaderAvatar.src = state.currentUser.avatar;

    const navAvatar = safeQuery(".header .avatar-btn img");
    if (navAvatar) navAvatar.src = state.currentUser.avatar;

    if (profileAboutPanel) {
      profileAboutPanel.innerHTML = `<p>${escapeHtml(state.currentUser.bio)}</p>`;
    }
  }

  function renderInterests() {
    if (!profileInterestsPanel) return;
    let interestsHtml = '';
    if (state.currentUser.interests.length > 0) {
      interestsHtml = `<ul class="chips" aria-label="Interests">
	  ${state.currentUser.interests.map(i => `<li class="chip">${escapeHtml(i)}</li>`).join('')}
	  </ul>`;
    } else {
      interestsHtml = '<p>No interests listed yet.</p>';
    }
    profileInterestsPanel.innerHTML = interestsHtml;
  }

  function renderPhotos() {
    if (!profilePhotosPanel || !profilePhotoGrid) return;
    let photosHtml = '';
    if (state.currentUser.photos.length > 0) {
      photosHtml = state.currentUser.photos.map(p => `<img src="${p}" alt="My photo" />`).join('');
    }
    photosHtml += `<button class="btn btn--ghost" data-action="add-photo">+ Add Photo</button>`;
    profilePhotoGrid.innerHTML = photosHtml;
  }

  /* =========================
	 NEW: Discovery Settings & Modals
	 ========================= */
  function bindDiscoverySettings() {
    if (!discoverSettingsBtn) return;
    discoverSettingsBtn.addEventListener('click', () => {
      routeTo('discover-settings', true);
    });
  }

  function bindModals() {
    // Subscription Modal
    if (modalSubscribe && subscribeBtn) {
      subscribeBtn.addEventListener('click', async () => {
        const button = subscribeBtn;
        button.textContent = 'Subscribing...';
        button.disabled = true;

        try {
          const result = await mockApi.subscribe();
          if (result.success) {
            state.currentUser.isSubscriber = true;
            alert("Success! You can now send messages.");
            modalSubscribe.close();
            // Reroute to messages page to apply change
            routeTo('messages', false);
          }
        } catch (e) {
          alert("Subscription failed. Please try again.");
        } finally {
          button.textContent = 'Pay 5000 MWK to Reply';
          button.disabled = false;
        }
      });
    }

    // Gift Modal
    if (modalGift) {
      const sendBtn = modalGift.querySelector("[data-action='send-gift']");
      if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
          const recipientId = modalGift.getAttribute("data-recipient-id");
          if (!recipientId) return;

          const button = sendBtn;
          button.textContent = 'Sending...';
          button.disabled = true;

          try {
            const result = await mockApi.sendGift(recipientId);
            if (result.success) {
              alert(result.message);
              modalGift.close();
            }
          } catch (e) {
            alert("Failed to send gift. Please try again.");
          } finally {
            button.textContent = 'Send Gift';
            button.disabled = false;
          }
        });
      }
    }
  }

  /* =========================
	 Small utilities
	 ========================= */
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setFooterYear() {
    if (!footerYear) return;
    footerYear.textContent = new Date().getFullYear();
  }

  /* =========================
	 Init everything
	 ========================= */
  document.addEventListener("DOMContentLoaded", () => init());

})();
