# API Design — aimeajob

## Response Envelope

All endpoints return:
```json
{
  "data": <payload>,
  "meta": { "timestamp": "ISO-8601" },
  "errors": null | [{ "code": "ERROR_CODE", "message": "Human-readable" }]
}
```

---

## Endpoints

### POST `/api/upload`

Upload a CV file, extract text, classify via LLM.

**Request:** `multipart/form-data`
- `file` (required): PDF or DOCX, max 10MB

**Response (200):**
```json
{
  "data": {
    "user_id": "uuid",
    "profile_id": "uuid",
    "extracted": {
      "years_experience": "5-9",
      "education_level": "Master's",
      "field_of_study": "STEM",
      "sphere_of_expertise": "Data Science",
      "seniority_level": "Senior",
      "languages": ["English", "Bulgarian"],
      "industry": "Technology",
      "key_skills": ["Python", "Machine Learning", "SQL", "TensorFlow", "Data Visualization"]
    },
    "confidence": {
      "years_experience": "high",
      "education_level": "high",
      "field_of_study": "high",
      "sphere_of_expertise": "high",
      "seniority_level": "medium",
      "languages": "high",
      "industry": "medium",
      "key_skills": "high"
    }
  }
}
```

**Errors:**
- 400: Invalid file type, file too large
- 422: Could not extract text from file
- 503: LLM service unavailable

---

### GET `/api/profile?user_id=<uuid>`

Retrieve a user's profile.

**Response (200):**
```json
{
  "data": {
    "profile_id": "uuid",
    "criteria": { ... },
    "preferences": { ... },
    "last_search_at": "ISO-8601" | null
  }
}
```

### PUT `/api/profile`

Update confirmed criteria after user edits.

**Request:**
```json
{
  "profile_id": "uuid",
  "criteria": {
    "years_experience": "5-9",
    "education_level": "Master's",
    "field_of_study": "STEM",
    "sphere_of_expertise": "Data Science",
    "seniority_level": "Senior",
    "languages": ["English", "Bulgarian"],
    "industry": "Technology",
    "key_skills": ["Python", "ML", "SQL"]
  }
}
```

**Validation:** All categorical fields must be from bounded lists. key_skills: 1-10 items. Languages: 1-10 items.

**Response (200):** Updated profile object.

---

### PUT `/api/preferences`

Save preference answers.

**Request:**
```json
{
  "profile_id": "uuid",
  "preferences": {
    "employment_type": ["Full-time", "Contract"],
    "location": "Berlin, Germany",
    "work_mode": "Remote",
    "relocation": true,
    "salary_min": 60000,
    "salary_max": 90000,
    "salary_currency": "EUR"
  }
}
```

All fields optional.

**Response (200):** Updated profile with preferences.

---

### POST `/api/search`

Run matching engine against profile.

**Request:**
```json
{
  "profile_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "results": [
      {
        "job_id": "uuid",
        "title": "Senior Data Scientist",
        "company": "Acme Corp",
        "location": "Berlin, Germany",
        "url": "https://...",
        "posted_at": "2026-03-01",
        "match_score": 7,
        "matched_criteria": [
          "years_experience",
          "education_level",
          "field_of_study",
          "sphere_of_expertise",
          "seniority_level",
          "industry",
          "key_skills"
        ],
        "unmatched_criteria": ["languages"],
        "salary_range": "€65K-€90K" | null,
        "employment_type": "Full-time" | null,
        "is_remote": true | null
      }
    ],
    "total_matches": 34,
    "search_id": "uuid"
  },
  "meta": {
    "threshold": 5,
    "max_score": 8,
    "searched_at": "ISO-8601"
  }
}
```

Results ordered by match_score DESC, then posted_at DESC. Max 50 results.

---

### POST `/api/search/delta`

Same as `/api/search` but only jobs ingested since `last_search_at`.

**Request:**
```json
{
  "profile_id": "uuid"
}
```

**Response:** Same shape as `/api/search`, plus:
```json
{
  "meta": {
    "since": "ISO-8601",
    "is_delta": true,
    "new_jobs_count": 12
  }
}
```

---

### POST `/api/save`

Save profile for later retrieval. Returns a unique restore token.

**Request:**
```json
{
  "profile_id": "uuid",
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "data": {
    "saved": true,
    "restore_token": "a7x9k2m4p1q8"
  }
}
```

**UX note:** Show the token prominently: "Save this code to restore your profile later: **a7x9k2m4p1q8**". User needs both email + token to restore (prevents enumeration).

---

### POST `/api/restore`

Restore a saved profile. Requires email + restore token.

**Request:**
```json
{
  "email": "user@example.com",
  "restore_token": "a7x9k2m4p1q8"
}
```

**Response (200):** Full profile object (criteria + preferences).
**Response (404):** No profile found (same response whether email wrong or token wrong — no enumeration).

---

## Rate Limits (MVP)

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/upload | 10 | per hour per IP |
| POST /api/search | 30 | per hour per IP |
| POST /api/save | 5 | per hour per IP |
| All others | 60 | per hour per IP |

Enforced via Vercel Edge Middleware or `upstash/ratelimit`.
