# CrimeNet

CrimeNet consists of a Flutter investigation dashboard and a FastAPI/SQLite
backend. Data entered in the UI is persisted; intelligence submissions are
analyzed for people, organizations, locations, phones, and vehicles, then used
to create graph relationships and suspicious-activity flags.

## Start the application

Terminal 1:

```bash
cd crimenet_backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app:app --reload --port 8000
```

Terminal 2:

```bash
cd crimenet_flutter
flutter pub get
flutter run -d chrome
```

Sign in with `analyst` / `Crimenet@123`. The frontend defaults to
`http://localhost:8000`; it can be changed and verified from Settings.

API documentation: `http://localhost:8000/docs`

## Implemented backend flows

- Session authentication with PBKDF2 password hashing
- SQLite persistence and referential integrity
- CRUD endpoints for cases, entities, and relationships
- Multi-source intelligence ingestion and automatic entity extraction
- Co-occurrence relationship creation and suspicious-pattern flags
- Network density and influencer/degree analytics
- Profile persistence
- Case-scoped or network-wide report generation and JSON dossier export
- Administrator-only starter-data restore

# t
