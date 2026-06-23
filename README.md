# Custom Chrome Home Page

A Manifest V3 Chrome extension that replaces the New Tab page with:

- A Google-style search bar.
- Gmail and Google Account buttons.
- A Gmail account dropdown for jumping directly to a chosen inbox.
- Collapsible open tab groups.
- Collapsible bookmark folders.

## Load It In Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.
5. Open a new tab.

## Configure Gmail Accounts

Edit `GMAIL_ACCOUNTS` at the top of `newtab.js`.

```js
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
```

Chrome/Gmail uses the `authUser` number to choose the signed-in account. Usually the first account is `0`, the second is `1`, and so on.
