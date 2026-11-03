# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Allow staff to sign up and unregister students
- Protect staff actions with a login session

## Getting Started

Run these commands from the repository root.

1. Install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Create a staff account (repeat this command to add more staff):

   ```
   python src/create_staff_account.py
   ```

   Account hashes are stored in the ignored local file `src/staff.json`; passwords are not stored in plain text.

3. Set a stable session secret and run the application:

   ```
   export SESSION_SECRET="replace-with-a-long-random-secret"
   uvicorn src.app:app --reload
   ```

   When serving over HTTPS, also set `SESSION_COOKIE_SECURE=true`.

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/session`                                                        | Check whether the current browser session is signed in as staff      |
| POST   | `/login`                                                          | Sign in with a staff username and password                           |
| POST   | `/logout`                                                         | End the current staff session                                        |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Staff-only student sign-up                                           |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Staff-only student removal                                       |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
