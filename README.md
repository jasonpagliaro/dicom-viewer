# DICOM Viewer

Dockerized DICOM viewer stack with:

- Next.js web app for uploads, study browsing, cases, reports, and share links
- Orthanc with OHIF, DICOMweb, GDCM, and PostgreSQL index enabled
- `tusd` for resumable large-file uploads
- Worker service that expands ZIPs, imports valid DICOM instances into Orthanc, and mirrors study metadata into Postgres
- Caddy reverse proxy exposing a single public origin

## What v1 includes

- Upload files, folders, and ZIP archives through a web UI
- Resumable tus uploads for large studies
- Searchable study library
- Case workspaces with linked studies
- Templated free-text reports with revision history and PDF export
- Revocable internal share links
- Split viewer page with OHIF on the left and case context on the right

## Stack

- Public app: `http://localhost:8080`
- Next.js app: internal `web:3000`
- Orthanc/OHIF: internal `orthanc:8042`, proxied under `/imaging/*`
- tusd: internal `tusd:1080`, proxied under `/files/*`
- Worker hook endpoint: internal `worker:4000/hooks/tusd`
- Postgres: internal `postgres:5432`

## Run

1. Start Docker Desktop or another Linux Docker engine.
2. From the repo root, run:

```bash
docker compose up --build
```

3. Open [http://localhost:8080](http://localhost:8080).

The `web` service runs `prisma migrate deploy` on startup. Orthanc stores DICOM binaries on a Docker volume, while the app and Orthanc index both use Postgres.

## Local Node checks

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Environment

Defaults are documented in [.env.example](./.env.example). The compose file already sets the values needed for the local stack.

## Notes

- Data-backed pages are rendered dynamically at request time, so the Next.js build does not require a live database.
- Upload ingestion is upload-first only in v1. External PACS push or remote DICOMweb import is not implemented.
- Reports are templated free text. OHIF measurement tracking can be stored in Orthanc, but report fields are not auto-populated from measurements.
- Orthanc admin/explorer is not proxied publicly; only the viewer and required DICOMweb surface are exposed behind Caddy.
