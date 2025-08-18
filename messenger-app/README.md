## messenger-app

```
messenger-app/
├─ api/
│  ├─ app/
│  │  ├─ core/
│  │  │  ├─ config.py
│  │  │  ├─ security.py
│  │  │  └─ db.py
│  │  ├─ models/
│  │  │  ├─ user.py
│  │  │  ├─ conversation.py
│  │  │  └─ message.py
│  │  ├─ schemas/
│  │  │  ├─ auth.py
│  │  │  └─ message.py
│  │  ├─ routers/
│  │  │  ├─ auth.py
│  │  │  ├─ users.py
│  │  │  ├─ conversations.py
│  │  │  └─ messages.py
│  │  ├─ services/
│  │  │  └─ auth.py
│  │  ├─ deps.py
│  │  ├─ main.py
│  │  └─ ws.py
│  ├─ alembic/
│  │  ├─ versions/
│  │  └─ env.py
│  ├─ Dockerfile
│  ├─ pyproject.toml
│  ├─ alembic.ini
│  └─ .env.example
├─ web/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ store/
│  │  ├─ pages/
│  │  │  ├─ auth/
│  │  │  ├─ chats/
│  │  │  └─ dialog/[id].tsx
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  ├─ Dockerfile
│  ├─ package.json
│  └─ .env.example
├─ nginx/
│  ├─ nginx.conf
│  └─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ .gitignore
├─ .pre-commit-config.yaml
├─ Makefile
└─ README.md
```

