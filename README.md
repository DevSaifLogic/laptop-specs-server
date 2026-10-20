# Laptop Specs Server

A minimal Node.js receiver that appends laptop inventory records to `database/laptops.json`.

## Run

Requires Node.js 18 or later.

```powershell
npm start
```

The server listens on `127.0.0.1:8080` by default. Set `HOST`, `PORT`, and `LAPTOP_SPECS_SERVER_URL` explicitly when using a trusted LAN. This receiver has no authentication or TLS; it is for local development only. Records can contain Windows product keys and device identifiers, and its database is excluded from Git.
