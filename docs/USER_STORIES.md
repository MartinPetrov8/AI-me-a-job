# User Stories — MVP

---

## STORY-001: Upload and Extract CV
**As a** job seeker,
**I want to** upload my CV (PDF or Word) and have the AI extract my profile into structured categories,
**so that** I don't have to manually fill in a long form.

**ACCEPTANCE:**
- [ ] Accepts PDF and DOCX file uploads
- [ ] File size limit: 10MB
- [ ] AI extracts all 8 criteria within 30 seconds
- [ ] Extraction works for English-language CVs
- [ ] Returns categorical labels matching the predefined options
- [ ] Missing/unclear fields are left blank (not guessed)

---

## STORY-002: Review and Confirm Profile
**As a** job seeker,
**I want to** see what the AI extracted from my CV and correct any mistakes or fill in blanks,
**so that** my profile accurately represents me before matching starts.

**ACCEPTANCE:**
- [ ] All 8 extracted criteria displayed in editable form
- [ ] Each criterion with bounded options shows a dropdown/selector
- [ ] Key skills shown as editable tags (add/remove)
- [ ] Blank fields are visually distinct (highlighted or flagged)
- [ ] User can modify any field before proceeding
- [ ] "Confirm" button saves the profile and moves to next step

---

## STORY-003: Answer Preference Questions
**As a** job seeker,
**I want to** specify my job preferences (location, remote/onsite, employment type),
**so that** results match not just my background but also what I'm looking for.

**ACCEPTANCE:**
- [ ] Shows 3-5 preference questions after CV confirmation
- [ ] Employment type: multi-select from Full-time, Part-time, Contract, Freelance
- [ ] Location: free text input (country/city) or "Anywhere"
- [ ] Work mode: Remote, Hybrid, On-site, or "Any"
- [ ] Relocation: Yes/No
- [ ] Salary: optional range input (can skip)
- [ ] All preferences are optional — user can skip any/all

---

## STORY-004: Search and View Matched Jobs
**As a** job seeker,
**I want to** see a shortlist of jobs that match my profile and preferences,
**so that** I only review genuinely relevant opportunities.

**ACCEPTANCE:**
- [ ] Search executes on-demand when user clicks "Find Jobs"
- [ ] Results returned within 10 seconds
- [ ] Each result shows: job title, company, location, match summary, link to original posting
- [ ] Results are ordered by relevance (best match first)
- [ ] Minimum 10 results shown (if available in data)
- [ ] Maximum 50 results per search
- [ ] Each result links out to the original job posting (external URL)

---

## STORY-005: Refresh Search (24h Delta)
**As a** returning job seeker,
**I want to** refresh my search and see only new postings from the last 24 hours,
**so that** I don't re-review jobs I've already seen.

**ACCEPTANCE:**
- [ ] "Refresh" button or automatic prompt on return visit
- [ ] Only shows postings added since last search
- [ ] Uses the same profile + preferences from previous search
- [ ] Clearly indicates "X new jobs since your last search"
- [ ] If no new jobs, shows "No new matches — check back tomorrow"

---

## STORY-006: Save Profile via Email
**As a** job seeker who found value,
**I want to** save my profile by entering my email,
**so that** I can come back later without re-uploading my CV.

**ACCEPTANCE:**
- [ ] Email prompt appears AFTER results are shown (not before)
- [ ] Single email field — no password, no username
- [ ] Saves: extracted criteria + preferences + last search timestamp
- [ ] Return visit: enter email → profile loaded → can search immediately
- [ ] No verification email required for MVP
- [ ] Skippable — user can ignore and leave

---

## STORY-007: Mobile-First Experience
**As a** job seeker on my phone,
**I want to** use the app comfortably on a mobile browser,
**so that** I can search for jobs on the go.

**ACCEPTANCE:**
- [ ] All pages render correctly on 375px-width screens (iPhone SE)
- [ ] File upload works on mobile (camera/files picker)
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal scrolling required
- [ ] Results list is scrollable and readable on mobile
- [ ] Page load time < 3 seconds on 4G

---

## STORY-008: Landing Page
**As a** first-time visitor,
**I want to** understand what this tool does in 5 seconds and start using it immediately,
**so that** I don't bounce.

**ACCEPTANCE:**
- [ ] Hero section: clear value proposition in one sentence
- [ ] Single prominent CTA: "Upload Your CV" or "Get Started"
- [ ] No registration required to start
- [ ] Loads in under 2 seconds
- [ ] Works without JavaScript for initial render (SSR or static)
- [ ] Brief "How it works" section (3 steps max)
