# articleblog
An article blog written using a myriad of web technologies.

Default PORT is 8000

Technologies used:
NodeJS
EJS
JS
HTML
CSS

Notable Frameworks/Libraries:
BootStrap
ExpressJS
Passport
MongoDB

.env Variables required:
- COOKIE_SECRET: Cookie secret for express-session
- DEV_MODE: Set app to dev mode, false for Production setup
- MONGO_INITDB_DATABASE: name of database
- MONGO_INITDB_ROOT_USERNAME: MongoDB auth table username
- MONGO_INITDB_ROOT_PASSWORD: MongoDB auth table password
- DB_USER: db username
- DB_PASS: db password
- PORT
- IP
- SMTP_HOST (hostname for smtp server)
- EMAIL_PORT (email port)
- EMAIL_USER (email auth user)
- EMAIL_PASS (email auth pass)
- EMAIL_SENDER (sender name on the email itself)

### Things to do when Blog is ready for production
- Add SSL
- Add Cloudflare protection
- Enable HSTS protection
- Add SSL content security policy flags
- Some Docker things with SSL
- Set Cookies to secure only.
- Add [Expect-CT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect-CT)
- Add [Public Key Pins](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Public-Key-Pins)
- Research if there's anything security/ssl specific to MongoDB usage
