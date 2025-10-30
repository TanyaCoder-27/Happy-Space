Internship Task: MERN + OAuth Project -- Image Search & Multi-Select

 Objective:
 Build a real-world full-stack project using the MERN stack (MongoDB, Express.js, React.js, Node.js) and
 OAuth authentication. This task evaluates your understanding of authentication, frontend/backend integration,
 and data management.

 Project Goal:- Only authenticated users can search images.- Search results are fetched from Unsplash API.- Results are displayed in a multi-select grid format.- Users can view top searches across all users.- Each user has a personal search history.

 Functional Requirements:
 1. Authentication
 Use OAuth login via Google, Facebook, and GitHub using Passport.js. Only logged-in users can search or
 view their history.

 2. Top Searches Banner
 API: GET /api/top-searches
 Display top 5 most frequent search terms across all users. Show this as a banner at the top of the app.

 3. Search Functionality
 API: POST /api/search with { term }
 Backend:- Store { userId, term, timestamp } in MongoDB.- Call Unsplash Search API and return image results.
 Frontend:- Show "You searched for X' -- N results."- Display images in a 4-column grid.- Overlay each image with a checkbox for multi-select.

 4. Multi-Select Counter
 Track selected images using client-side state. Display a dynamic counter like: "Selected: X images" above
 the grid.

 5. User's Search History
 API: GET /api/history
Show the logged-in user's past search terms with timestamps. Can be shown in a sidebar or below the
 results.
 Project Structure:
 /client  (React frontend)
 /server  (Express backend)
 
 Deliverables:
 1. GitHub Repository with:
   - Full code for /client and /server.
   - OAuth + Unsplash integration.
 2. README File including:
   - Setup instructions (with .env details for Unsplash API and OAuth keys).
   - Explanation of folder structure.
   - Postman Collection or cURL examples for all API endpoints.
 3. Visual Proof (in the repo or attached):
   - Screenshots/GIFs of:
     - OAuth login
     - Top Searches banner
     - Search results + multi-select
     - Search history section