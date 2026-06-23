const GMAIL_ACCOUNTS = [
  {
    label: "Personal",
    email: "your.email@gmail.com",
    authUser: 0,
    color: "#1a73e8"
  },
  {
    label: "Work",
    email: "work.email@example.com",
    authUser: 1,
    color: "#188038"
  }
];

const els = {
  accountButton: document.querySelector("#account-button"),
  bookmarks: document.querySelector("#bookmarks"),
  clockDate: document.querySelector("#clock-date"),
  clockTime: document.querySelector("#clock-time"),
  gmailButton: document.querySelector("#gmail-button"),
  gmailMenu: document.querySelector("#gmail-menu"),
  gmailMenuButton: document.querySelector("#gmail-menu-button"),
  greeting: document.querySelector("#greeting"),
  refreshBookmarks: document.querySelector("#refresh-bookmarks"),
  refreshTabs: document.querySelector("#refresh-tabs"),
  tabGroups: document.querySelector("#tab-groups")
};

const tabGroupColors = {
  blue: "#1a73e8",
  red: "#d93025",
  yellow: "#fbbc04",
  green: "#188038",
  pink: "#d01884",
  purple: "#9334e6",
  cyan: "#007b83",
  orange: "#fa7b17",
  grey: "#5f6368"
};

init();

function init() {
  renderDateTime();
  setInterval(renderDateTime, 1000);
  renderGmailMenu();
  loadBookmarks();
  loadTabGroups();

  els.gmailButton.addEventListener("click", () => openUrl("https://mail.google.com/mail/u/0/#inbox"));
  els.gmailMenuButton.addEventListener("click", toggleGmailMenu);
  els.accountButton.addEventListener("click", () => openUrl("https://myaccount.google.com/"));
  els.refreshBookmarks.addEventListener("click", loadBookmarks);
  els.refreshTabs.addEventListener("click", loadTabGroups);
  document.addEventListener("click", closeMenuOnOutsideClick);
  document.addEventListener("keydown", closeMenuOnEscape);
}

function renderDateTime() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  els.greeting.textContent = greeting;
  els.clockTime.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);
  els.clockDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);
}

function renderGmailMenu() {
  els.gmailMenu.textContent = "";

  GMAIL_ACCOUNTS.forEach((account) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.addEventListener("click", () => {
      setGmailMenuOpen(false);
      openUrl(`https://mail.google.com/mail/u/${account.authUser}/#inbox`);
    });

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.style.background = account.color;
    avatar.textContent = account.label.slice(0, 1).toUpperCase();

    const text = document.createElement("span");
    const label = document.createElement("span");
    const email = document.createElement("span");
    label.className = "menu-label";
    email.className = "menu-email";
    label.textContent = account.label;
    email.textContent = account.email;
    text.append(label, email);

    button.append(avatar, text);
    els.gmailMenu.append(button);
  });
}

async function loadBookmarks() {
  if (!globalThis.chrome?.bookmarks) {
    renderEmpty(els.bookmarks, "Bookmarks are available after loading this as a Chrome extension.");
    return;
  }

  const tree = await chrome.bookmarks.getTree();
  const roots = tree[0]?.children ?? [];
  const folders = roots
    .flatMap((root) => root.children ?? [])
    .filter((node) => node.children?.length);

  els.bookmarks.textContent = "";

  if (!folders.length) {
    renderEmpty(els.bookmarks, "No bookmark folders found yet.");
    return;
  }

  folders.forEach((folder, index) => {
    const links = flattenBookmarkLinks(folder).slice(0, 18);
    if (!links.length) return;
    els.bookmarks.append(createFolder(folder.title || "Bookmarks", links, index < 2));
  });

  if (!els.bookmarks.children.length) {
    renderEmpty(els.bookmarks, "No bookmark links found in your folders.");
  }
}

async function loadTabGroups() {
  if (!globalThis.chrome?.tabs || !globalThis.chrome?.tabGroups) {
    renderEmpty(els.tabGroups, "Tab groups are available after loading this as a Chrome extension.");
    return;
  }

  const tabs = await chrome.tabs.query({});
  const groupedTabs = tabs.filter((tab) => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
  const groupsById = new Map();

  groupedTabs.forEach((tab) => {
    const groupTabs = groupsById.get(tab.groupId) ?? [];
    groupTabs.push(tab);
    groupsById.set(tab.groupId, groupTabs);
  });

  els.tabGroups.textContent = "";

  if (!groupsById.size) {
    renderEmpty(els.tabGroups, "No open tab groups right now.");
    return;
  }

  const groupEntries = await Promise.all(
    Array.from(groupsById.entries()).map(async ([groupId, groupTabs]) => ({
      group: await chrome.tabGroups.get(groupId),
      tabs: groupTabs
    }))
  );

  groupEntries
    .sort((a, b) => a.group.windowId - b.group.windowId || a.group.title.localeCompare(b.group.title))
    .forEach(({ group, tabs }, index) => {
      const title = group.title || "Untitled group";
      const folder = createFolder(title, tabs, index < 3, {
        color: tabGroupColors[group.color] ?? tabGroupColors.grey,
        isTabGroup: true
      });
      els.tabGroups.append(folder);
    });
}

function createFolder(title, items, open, options = {}) {
  const details = document.createElement("details");
  details.className = "folder";
  details.open = open;

  const summary = document.createElement("summary");
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.classList.add("chevron");
  chevron.innerHTML = '<path fill="currentColor" d="M9.3 6.35a.9.9 0 0 1 1.27 0l5.01 5.01a.9.9 0 0 1 0 1.28l-5.01 5.01a.9.9 0 1 1-1.27-1.27L13.67 12 9.3 7.62a.9.9 0 0 1 0-1.27Z"></path>';

  const label = document.createElement("span");
  label.className = "folder-title";
  label.textContent = title;
  if (options.color) {
    label.style.borderLeft = `4px solid ${options.color}`;
    label.style.paddingLeft = "8px";
  }

  const count = document.createElement("span");
  count.className = "count-pill";
  count.textContent = items.length;

  summary.append(chevron, label, count);

  const list = document.createElement("div");
  list.className = "item-list";
  items.forEach((item) => list.append(createLinkRow(item, options.isTabGroup)));

  details.append(summary, list);
  return details;
}

function createLinkRow(item, isTab) {
  const url = item.url ?? "";
  const link = document.createElement("a");
  link.className = "link-row";
  link.href = url;
  link.title = item.title || url;

  if (isTab) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      chrome.windows.update(item.windowId, { focused: true });
      chrome.tabs.update(item.id, { active: true });
    });
  }

  const favicon = document.createElement("img");
  favicon.className = "favicon";
  favicon.alt = "";
  favicon.loading = "lazy";
  favicon.src = getFaviconUrl(url);

  const title = document.createElement("span");
  title.className = "link-title";
  title.textContent = item.title || url || "Untitled";

  link.append(favicon, title);
  return link;
}

function flattenBookmarkLinks(node) {
  const links = [];

  function walk(current) {
    if (current.url) {
      links.push(current);
      return;
    }

    (current.children ?? []).forEach(walk);
  }

  walk(node);
  return links;
}

function getFaviconUrl(url) {
  if (!url) return "";
  const faviconUrl = new URL(chrome.runtime.getURL("_favicon/"));
  faviconUrl.searchParams.set("pageUrl", url);
  faviconUrl.searchParams.set("size", "32");
  return faviconUrl.toString();
}

function toggleGmailMenu(event) {
  event.stopPropagation();
  setGmailMenuOpen(els.gmailMenu.hidden);
}

function setGmailMenuOpen(open) {
  els.gmailMenu.hidden = !open;
  els.gmailMenuButton.setAttribute("aria-expanded", String(open));
}

function closeMenuOnOutsideClick(event) {
  if (!event.target.closest(".gmail-control")) {
    setGmailMenuOpen(false);
  }
}

function closeMenuOnEscape(event) {
  if (event.key === "Escape") {
    setGmailMenuOpen(false);
    els.gmailMenuButton.focus();
  }
}

function openUrl(url) {
  window.location.href = url;
}

function renderEmpty(container, message) {
  container.textContent = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  container.append(empty);
}
