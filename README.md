# 1. Requirements
Before starting make sure you have:
- Node.js (Version 16 or higher)

# 2. Project Setup
## Step 1: Clone the repository
```
git clone https://github.com/obsoletedevgit/www-podzol.git
```
```
cd www-podzol
```

## Step 2: Install dependencies
``` 
npm install
```

## Step 3: Environment configuration
Copy the example environment file and update it:
```
cp .env.example .env
```
Then edit .env to include your desired settings:
```
PORT=3000

NODE_ENV=development

SESSION_SECRET=change-me-to-a-random-string
MAIL_ENCRYPTION_KEY=32bytehexvaluehere

(you can generate a MAIL_ENCRYPTION_KEY using)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

BASE_URL=http://localhost:3000
```
### SMTP mail configuration:
```
SMTP_HOST=smtp.yourmailserver.com

SMTP_PORT=587

SMTP_USER=your@email.com

SMTP_PASS=yourpassword

FROM_EMAIL=your@email.com

FROM_NAME=Podzol
```
# 3. Starting the server
## Option 1: Development mode (with auto reload)
```
npm run dev
```
## Option 2: Production mode
```
npm start
```
Once the server starts you should see in the console:
```
Connected to SQLite database
Database initialized
Podzol is running on http://localhost:YOUR_PORT
```

Now go to your browser and open `localhost:YOUR_PORT`
The setup wizard will guide you through initial configuration for:
- Account name and biography
- Profile image
- Privacy setting
- Admin password

# 4. Directory overview
```
.
├── backend
│   ├── config
│   │   └── database.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── profileController.js
│   │   └── subscriptionController.js
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   └── privateAccessMiddleware.js
│   ├── models
│   │   └── schema.sql
│   ├── routes
│   │   ├── apiRouter.js
│   │   └── pageRouter.js
│   ├── server.js
│   └── utils
│       └── emailService.js
├── data
├── frontend
│   ├── css
│   │   ├── 404.css
│   │   ├── admin.css
│   │   ├── index.css
│   │   ├── links.css
│   │   ├── setup.css
│   │   └── styles.css
│   ├── js
│   │   ├── admin.js
│   │   ├── index.js
│   │   ├── links.js
│   │   ├── setup.js
│   │   └── utils
│   │       ├── api.js
│   │       └── auth.js
│   ├── media
│   │   └── icons
│   │       ├── image.svg
│   │       ├── link.svg
│   │       ├── logo.svg
│   │       ├── long_form.svg
│   │       └── status.svg
│   └── pages
│       ├── 404.html
│       ├── admin.html
│       ├── index.html
│       ├── links.html
│       └── setup.html
├── package.json
├── package-lock.json
├── README.md
└── uploads

17 directories, 37 files
```
# 5. Mail server setup
Podzol can email updates to subscribers whenever you post.

To enable this feature, you must configure SMTP credentials.

## Step 1: Choose a mail service
You can use any SMTP-compatible provider, such as:
- Gmail (with app password)
- Outlook/Office365
- ProtonMail (via Proton Bridge)
- Mailgun, SendGrid, or similar

## Step 2: Update environment variables
In your `.env` file, set:
SMTP_HOST=smtp.mailprovider.com
SMTP_PORT=587
SMTP_USER=username-or-email
SMTP_PASS=your-password-or-app-key
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME=Podzol Notifications

# Step 3: Verify configuration
When the server starts, you’ll see a log like:
```
Connected to SQLite database

Database initialized

Email transporter active

If the SMTP credentials are invalid, Podzol will fall back to “silent mode” and log:

Email not configured

Emails are sent using Nodemailer and follow your privacy mode—only subscribers you approve receive notifications.
```

# 6. Privacy Modes
| Mode    | Description                                             |
|---------|---------------------------------------------------------|
| Public  | Anyone with your site URL can view your posts.          |
| Private | Visitors must enter a password you define during setup. |

# 7. Data storage
Podzol uses a local SQLite database ```(data/podzol.db)``` to store:
- Profile information

- Posts and media references

- Email subscribers

- Mail server configuration
You can back up or migrate your site by simply copying the `data/` and `uploads/` folders.

# 8. Troubleshooting
| Issue                      | Cause                                    | Fix                                           |
|----------------------------|------------------------------------------|-----------------------------------------------|
| Port already in use        | Another service is on your selected port | Change PORT in .env                           |
| Cannot log in (admin)      | Wrong password                           | Restart server and follow reset instructions  |
| Subscriber emails not sent | SMTP not configured or invalid           | Check .env credentials                        |
| Database locked            | Multiple processes accessing DB          | Restart server; ensure only one instance runs |

For full logs, check your terminal output—Podzol logs all route errors and mail events.

# 9. Updating Podzol
To update your installation:
```
git pull origin main
npm install
npm run build   (if applicable)
npm start
```
Your existing data in `data/` and `uploads/` will remain intact.

# 10. Security Recommendations
- Always use a strong SESSION_SECRET in production.

- Use HTTPS (behind a reverse proxy like Nginx or Caddy).

- Keep your SQLite database backups encrypted.

- Never expose your .env file publicly.
