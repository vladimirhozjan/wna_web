export const faq = [
  // --- Account & Authentication ---
  {
    question: 'How do I create an account?',
    answer:
      'Tap "Start Free" on the landing page. Enter your email address, choose a password (at least 8 characters with at least one letter, one digit, and one symbol), and confirm it. After registering you are automatically logged in and taken to your Dashboard.',
  },
  {
    question: 'How do I log in?',
    answer:
      'Tap "Sign In" on the landing page and enter your email and password. On success you are redirected to your Dashboard. If you have forgotten your password, use the "Forgot your password?" link to reset it.',
  },
  {
    question: 'How do I reset my password?',
    answer:
      'On the login screen, tap "Forgot your password? Reset it." Enter your email address and follow the instructions. You will be taken to a form where you can set a new password and then log in with it.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings and find the Account section. Tap "Change Password." You will need to enter your current password and then type and confirm your new password. All other sessions are automatically revoked when you change your password.',
  },
  {
    question: 'How do I log out?',
    answer:
      'You can log out from three places: the avatar dropdown in the top navigation bar, the Sidebar footer, or the Settings page under Sessions by ending your current session. A confirmation dialog will appear before you are signed out. Logging out in one tab logs you out of all open tabs automatically.',
  },
  {
    question: 'What are sessions and how do I manage them?',
    answer:
      'Each device or browser you log in from creates a session. Go to Settings to see all your active sessions, including the device name, IP address, and last activity time. You can end any individual session remotely or use "End Others" to revoke all sessions except the one you are currently using.',
  },

  // --- GTD Concepts ---
  {
    question: 'What is Getting Things Done (GTD)?',
    answer:
      'Getting Things Done is a productivity methodology created by David Allen. It is built on five steps: Capture everything that has your attention, Clarify what each item means and what action it requires, Organize the results into the right categories, Reflect on your system regularly, and Engage with confidence knowing nothing is slipping through the cracks. WhatsNextAction implements this methodology so you can achieve stress-free productivity.',
  },
  {
    question: "What's the difference between a project and an action?",
    answer:
      'An action is a single, concrete, physical step you can take — for example, "Call the dentist to schedule an appointment." A project is any outcome that requires more than one action step to complete — for example, "Plan birthday party." Every active project must always have at least one next action. When you complete a project\'s next action, the next item in the backlog automatically promotes to become the new next action.',
  },
  {
    question: 'What is the difference between Next Actions and Today?',
    answer:
      'Next Actions is your full list of ready-to-do actions — things you could work on right now. Today is a focused subset of actions you have specifically chosen to work on today. Think of Next Actions as your complete menu and Today as what you have put on your plate for the day.',
  },
  {
    question: 'What is the Weekly Review?',
    answer:
      'The Weekly Review is a cornerstone of GTD. It is a routine where you step back and review your entire system to make sure it is complete and current. WhatsNextAction guides you through six steps: empty your Inbox, review Next Actions, review Waiting For items, review Projects, review Someday/Maybe, and review your Calendar. You can enable it in Settings and even set up a recurring reminder.',
  },

  // --- Inbox & Clarify ---
  {
    question: 'How do I add a new item?',
    answer:
      'Use the Quick Add button (+) in the top navigation bar to capture something from any page. You can also go to your Inbox and type directly into the input field at the top. Press Enter to save. Everything you capture starts as "stuff" in your Inbox — raw, unprocessed items with no metadata.',
  },
  {
    question: 'What is the Inbox and how does it work?',
    answer:
      'The Inbox is your capture zone for raw, unprocessed items called "stuff." Items in the Inbox intentionally have no tags, due dates, or delegation — they are just titles. The idea is to get things out of your head quickly without worrying about organizing. When you are ready, use the Clarify button to process each item and decide what it means and where it belongs.',
  },
  {
    question: 'What happens during Clarify?',
    answer:
      'Clarify is a guided, step-by-step wizard that helps you process each Inbox item according to GTD principles. First you decide whether the item is actionable. If not, you can file it as Reference, park it in Someday/Maybe, or Trash it. If it is actionable, you decide whether it is a single action or a multi-step project. Single actions that take less than two minutes should be done immediately (the two-minute rule). Otherwise, you create an action with optional tags, dates, and a description, or create a project with an outcome definition.',
  },

  // --- Moving & Organizing ---
  {
    question: 'How do I move an item to a different list?',
    answer:
      'Open the item\'s detail page and use the "Move" dropdown in the action bar at the top. It shows all valid destinations for that item. Some destinations require extra information — moving to Calendar asks for a date and time, Waiting For asks who you are waiting on, and Projects asks for an outcome. You can also drag items from any list view directly onto sidebar menu items to move them.',
  },
  {
    question: 'How do I complete an item?',
    answer:
      'In any list view, tap the checkbox next to an item to mark it as complete. You can also tap "Done" on the detail page. Completed items move to the Completed page. If you complete something by mistake, go to the Completed page and uncheck the checkbox — or tap "Undo" on the detail page — to restore it to its original list.',
  },
  {
    question: 'Can I reorder my lists?',
    answer:
      'Yes. You can drag and drop items to reorder them in the Inbox, Next Actions, Today, Waiting For, Someday/Maybe, Projects, and project action lists. On touch devices, press and hold an item briefly to start dragging. Your custom order is saved automatically.',
  },
  {
    question: 'What is Someday/Maybe?',
    answer:
      'Someday/Maybe is where you park ideas and possibilities that you are not ready to act on right now but do not want to forget. Stuff, actions, and projects can all live here. During your Weekly Review, scan this list to see if anything should be activated. Use the "Activate" button to move an item back to its original bucket when you are ready to act on it.',
  },
  {
    question: 'What is the Waiting For list?',
    answer:
      'Waiting For tracks actions you have delegated or are waiting on someone else to complete. Each item records who or what you are waiting for and how long you have been waiting. When the item comes back to you, use the "Got it" button to move it to your Next Actions list, or mark it as done if it has been completed.',
  },

  // --- Calendar & Dates ---
  {
    question: 'Can I set due dates and deferred dates?',
    answer:
      'Yes. On any action\'s detail page, expand the Dates section. You can set a due date with an optional time for hard deadlines. You can also defer an action with either "Scheduled for" (a specific date, time, and duration that appears on your Calendar) or "Start after" (a tickler date that hides the action until that day, then surfaces it in Next Actions).',
  },
  {
    question: 'How does the Calendar work?',
    answer:
      'The Calendar shows your time-specific actions and commitments — your "hard landscape" in GTD terms. It offers Day, Week, Month, and Year views. In Day and Week views, scheduled actions appear as time blocks based on their start time and duration. You can click an empty time slot to create a new action, drag items to reschedule them, and switch to the Recurring view to manage repeating actions. Calendar settings (week start day, time format, business hours) are configurable in Settings.',
  },
  {
    question: 'What are recurring actions?',
    answer:
      'Recurring actions let you create templates that automatically spawn action instances on a schedule. You can set the frequency (daily, weekly, monthly, or yearly), choose specific days, set a time and duration, and define an end condition (never, after N occurrences, or until a date). Access recurring templates from the Calendar page\'s Recurring view. This feature is available on the Pro and Business plans.',
  },

  // --- Tags & Filtering ---
  {
    question: 'What are context tags and how do I use them?',
    answer:
      'Context tags help you filter your actions by where you are or what resources you have available. Common examples include @computer, @phone, @office, @home, and @errands. You can also use energy levels (energy:high, energy:low) or time estimates (min:5, min:30). Add tags to any action or project from its detail page. Use the per-page tag filter icon to filter a single list, or set a global Context Filter in the sidebar to filter all lists at once.',
  },
  {
    question: 'Can I customize my tag presets?',
    answer:
      'Yes. Go to Settings and find the Tags section. Your current presets are shown as chips. Tap to edit them — you can add, remove, or reorder the preset tags that appear as quick-add buttons when tagging items. The defaults are @computer, @office, @home, @calls, @anywhere, energy:high, energy:low, min:5, and min:30.',
  },

  // --- Detail Pages, Comments & Attachments ---
  {
    question: 'How do I edit an item\'s title or description?',
    answer:
      'Tap the title text in any list view to edit it inline — press Enter or tap outside to save, or press Escape to cancel. On the detail page, tap the title or description area to start editing. The title field auto-resizes as you type. Changes are saved when you finish editing.',
  },
  {
    question: 'Can I add comments to items?',
    answer:
      'Yes. Every action, project, and stuff item has a Comments section on its detail page. Tap "Add a comment..." to open the text area, type your note (up to 2000 characters), and tap Save. Comments are shown newest-first with your avatar and a relative timestamp. Each item supports up to 50 comments. Comments cannot be edited or deleted after posting.',
  },
  {
    question: 'Can I attach files to items?',
    answer:
      'Yes. Actions, projects, and stuff items each support up to 10 file attachments (50 MB max per file). On the detail page, click the upload area or drag and drop files onto it. Upload progress is shown in real time. Attached images and PDFs can be previewed directly in the app. You can also download or delete any attachment.',
  },

  // --- Reference & Files ---
  {
    question: 'How does the Reference file manager work?',
    answer:
      'Reference is your non-actionable file storage — the GTD "Reference" bucket. It works like a file manager with folders, file uploads (up to 50 MB per file), global search, and a separate trash. You can create folders, upload files by clicking or dragging, rename and move items, and preview images, PDFs, and text files in the browser. Your storage quota is shown in the toolbar. Stuff items clarified as "Reference" are automatically saved here as text notes.',
  },

  // --- Trash & Recovery ---
  {
    question: 'How do I recover deleted items?',
    answer:
      'When you delete an item, it moves to the Trash instead of being permanently removed. Visit the Trash page to restore individual items back to their original list. If you want to permanently remove everything, use the "Empty Trash" button — be careful, this action cannot be undone. The Reference file manager has its own separate trash with the same restore and permanent delete options.',
  },

  // --- Account & Security ---
  {
    question: 'Is my data secure?',
    answer:
      'Your account is protected by password requirements (minimum 8 characters with letters, digits, and symbols) and token-based authentication. Sessions are tracked per device — you can review, revoke, or end them from Settings at any time. Logging out in one browser tab instantly logs you out of all other open tabs. Changing your password automatically ends all other sessions.',
  },

  // --- Plans & Limits ---
  {
    question: 'What plans are available?',
    answer:
      'WhatsNextAction offers three plans. The Free plan lets you get started with up to 10 projects, 50 actions, 10 stuff items, 5 context tags, and 10 MB of file storage. The Pro plan is for serious users — up to 100 projects, 500 actions, recurring actions, 25 tags, and 250 MB of storage. The Business plan provides unlimited projects, actions, stuff, tags, 1 GB of storage, and dedicated support. Visit the Pricing page for full details and yearly discounts.',
  },
  {
    question: 'What are the limits on attachments and comments?',
    answer:
      'Each item (action, project, or stuff) supports up to 10 file attachments with a maximum of 50 MB per file. Comments are limited to 50 per item, with each comment up to 2000 characters. These limits apply across all plans.',
  },

  // --- Device & Accessibility ---
  {
    question: 'Can I use WhatsNextAction on my phone?',
    answer:
      'Yes. WhatsNextAction is a responsive web application that works on any device with a modern browser. On mobile you get a slide-in navigation drawer, bottom action sheets for dropdowns and selects, full-screen modals, and touch-friendly controls with tap targets of at least 44 pixels. Action buttons are always visible on touch devices without needing to hover.',
  },
  {
    question: 'Are there keyboard shortcuts?',
    answer:
      'Yes. Press Enter to submit forms and save inline edits. Press Escape to cancel editing, close modals, and close dropdowns. In the Clarify wizard, Backspace goes back a step (when you are not typing in an input). In the tag input, arrow keys navigate suggestions and comma commits a tag. On list pages, long-press (touch) or click-and-drag (desktop) to reorder items.',
  },

  // --- Dashboard ---
  {
    question: 'What is the Dashboard / Engage page?',
    answer:
      'The Engage page is your home screen after logging in. It gives you a bird\'s-eye overview: a red alert if anything is overdue, your Today actions, a snapshot of Next Actions, your Waiting For items, and nudges when your Inbox needs clarifying, projects are missing a next action, or your Weekly Review is overdue. All sections respect the active Context Filter so you can focus on one context at a time.',
  },
]