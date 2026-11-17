STUDY PARTNER: INSTALLABLE APP (PWA)

FILES (keep them together in one folder)
  index.html            the app
  manifest.webmanifest  name, colours and icons
  sw.js                 makes it work offline
  icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png

HOW TO PUT IT ONLINE (free, pick one)
  Netlify Drop:  go to app.netlify.com/drop and drag this whole folder onto the page.
  GitHub Pages:  upload the files to a new GitHub repository, then
                 Settings > Pages > deploy from the main branch.
  A PWA only installs from an https:// address (or localhost), not from a file on your computer.

HOW TO INSTALL
  Android (Chrome):  open the link > menu > "Install app".
  iPhone (Safari):   open the link > Share > "Add to Home Screen".
  Laptop (Chrome/Edge): click the install icon in the address bar.

AFTER YOU CHANGE ANY FILE
  Open sw.js and raise the number in  const CACHE = 'study-partner-v1';  (v2, v3 ...)
  so phones download the new version.

NOTE
  Plans, to-dos, flashcards and exams are saved on each device.
  The Ask AI tab only works when the page is opened inside claude.ai.
