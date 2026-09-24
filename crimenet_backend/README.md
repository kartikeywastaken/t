# CrimeNet backend

Persistent FastAPI + SQLite backend for the Flutter CrimeNet client.

## Run

```bash
cd crimenet_backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app:app --reload --port 8000
```

Open the Flutter app and sign in with:

- Username: `analyst`
- Password: `Crimenet@123`

The SQLite database is created at `crimenet_backend/crimenet.db`. Set
`CRIMENET_DB=/absolute/path/database.db` to use another location. Interactive API
documentation is available at `http://localhost:8000/docs`.

