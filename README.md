# SpikeCoach

SpikeCoach is an Overwolf Native companion app for VALORANT designed to help players review their performance, explore strategies, practice rank recognition, and access useful match information through a clean in-game and desktop interface.

The app combines live Overwolf game-event data with custom performance metrics, post-match recommendations, strategy tools, and an AI-powered coaching assistant.

---

## Features

### In-Game VALORANT Overlay

SpikeCoach includes a dedicated Overwolf Native in-game window that can automatically open when a VALORANT match begins.

The overlay includes:

- Personal Stats
- Team Scoreboard
- Custom Impact Rating
- Post-Match Recommendations
- Map-specific header artwork
- Configurable overlay hotkey
- Vertically resizable overlay window

The overlay can be toggled using a customizable shortcut, with:

`Ctrl + Shift + K`

as the default keybind.

Supported alternatives include:

- `Ctrl + Shift + L`
- `Ctrl + Shift + J`
- `Ctrl + Shift + M`

---

## Impact Rating

SpikeCoach includes its own custom performance metric called **Impact Rating**.

Impact Rating provides a score from **1.0 to 10.0** based on multiple aspects of a player's contribution to the team rather than relying only on kills.

Factors can include:

- Combat performance
- Damage
- Assists and team contribution
- Utility impact
- Survivability
- Economy and consistency

The local player's rating uses more detailed match information when available, while other players are evaluated using the shared statistics available through Overwolf.

Impact Rating updates after completed rounds instead of constantly changing during fights.

> Impact Rating is a SpikeCoach-created metric and is not an official Riot Games statistic.

---

## Post-Match Recommendations

After a match ends, SpikeCoach evaluates the player's performance and provides personalized recommendations.

Recommendation categories include:

- Dueling
- Survivability
- Teamplay
- Utility
- Economy
- Weapon Usage
- Precision
- Consistency
- Adaptation

Recommendations use match statistics and are designed to highlight both strengths and areas for improvement.

They are generated retrospectively after the match rather than providing live tactical instructions.

---

## Personal Match Statistics

SpikeCoach can display information such as:

- Agent
- Health
- Kills
- Deaths
- Assists
- Credits
- Weapon
- Shield
- Ultimate status
- Team side
- Current round
- Match score
- Map
- Game mode
- Headshot percentage
- Round report statistics
- Impact Rating

Match information is provided through the Overwolf Native VALORANT Game Events Provider.

---

## Team Scoreboard

The Team Scoreboard provides a live view of available player statistics during a match.

Depending on available game data, this can include:

- Agent
- Kills
- Deaths
- Assists
- Credits
- Weapon
- Ultimate progress
- Team
- SpikeCoach Impact Rating

---

## Guess the Rank

Guess the Rank lets users watch VALORANT gameplay clips and try to identify the player's competitive rank.

The system supports individual subranks such as:

- Gold 2
- Platinum 3
- Diamond 1
- Ascendant 2

Points are awarded based on how close the guess is to the actual rank.

Example scoring:

| Rank Distance | Points |
|---|---:|
| Exact | 100 |
| 1 subrank away | 85 |
| 2 away | 70 |
| 3 away | 55 |
| 4 away | 40 |
| 5 away | 25 |
| 6 away | 15 |
| 7+ away | 0 |

Clips are loaded dynamically from Supabase and randomized so sessions do not always begin with the same video.

YouTube is used for video playback.

New Guess the Rank clips can be added remotely without publishing a new SpikeCoach build.

---

## Strategy Planner

SpikeCoach includes a strategy planning interface for creating VALORANT setups.

Features include:

- Map selection
- Five agents per team
- Drag-and-drop agent placement
- Ability icons
- Strategy arrows
- Team positioning visualization

The planner is designed for preparing and visualizing strategies outside active gameplay.

---

## Lineups

The Lineups section allows players to browse agent-specific VALORANT lineups organized by map, agent, and ability.

The system is designed so additional lineup content can be added over time.

---

## AI Coach

The main SpikeCoach application contains an AI-powered VALORANT assistant.

AI Coach can answer general VALORANT-related questions and provide educational guidance.

To maintain a clear separation between live gameplay and AI assistance:

- AI Coach is located in the main SpikeCoach application
- AI Coach is not included in the in-game VALORANT overlay
- AI Coach is disabled while an active VALORANT match is in progress
- It automatically becomes available again after the match ends

The AI backend is hosted separately from the Overwolf client so API credentials are never exposed in the frontend.

---

## Authentication

SpikeCoach uses Firebase Authentication.

Supported account functionality includes:

- Email/password registration
- Login
- Email verification
- Password reset
- Persistent login
- User display names

Supabase is used separately for remote content such as Guess the Rank clips.

---

## Technology Stack

### Desktop / In-Game App

- Overwolf Native
- HTML
- CSS
- JavaScript
- Overwolf Game Events Provider

### Authentication

- Firebase Authentication

### Remote Content

- Supabase
- YouTube embedded playback

### Backend

- Node.js
- Express
- OpenAI-compatible API
- Firebase Admin authentication
- Render deployment

---

## Project Structure

Some of the main files and directories include:

```text
SpikeCoach/
├── manifest.json
├── index.html
├── product.html
├── spikecoach-tab.html
├── script.js
├── product.js
├── spikecoach-match.js
├── style.css
├── firebase-init.js
├── supabase-client.js
├── guess-rank-clips.js
├── guess-rank-config.js
├── agent-abilities-manifest.js
├── server.js
├── package.json
│
├── Agent_Icons/
├── Agent Audios/
├── Map_Loading/
├── Map_minimaps/
└── Rank_Icons/
