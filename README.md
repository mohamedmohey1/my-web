# Expense Tracker

#### Video Demo: [Watch Video](https://youtu.be/K_HF28eGXlA)

#### Description:

Expense Tracker is a simple web application that helps users record, organize, and manage their daily expenses. I created this project as my final project for CS50. The main idea was to build something useful while practicing the programming concepts and web development skills that I learned during the course.

The website allows users to add expenses and keep their spending information in one place. Each expense can contain information such as its name, amount, category, and date. The user can also view previously added expenses and open more details about them. There are separate pages for adding expenses, viewing expenses, editing them, and viewing statistics.

I decided to make an expense tracker because tracking daily spending can become difficult when expenses are written in different places or simply forgotten. A small web application makes it easier to keep this information organized and available in one place. I also wanted my final project to be something that I could actually use and continue improving later.

The backend of the application was built using Python and Flask. Flask handles the different routes of the website and connects the web pages to the database. I used Flask because it is simple to work with and helped me understand how a Python backend can communicate with a website.

For the database, I used SQLite. I decided to use SQLite because I wanted the database setup to stay simple. The project does not need a large database system, and SQLite works well for storing the expenses locally. The database is stored in `expenses.db`, which contains the information used by the application.

The project also uses HTML, CSS, and JavaScript for the frontend. The HTML files are stored inside the `templates` folder. The project contains several pages, including `index.html`, `about.html`, `expenses.html`, `add.html`, `edit.html`, `details.html`, `statistics.html`, and `categories.html`. Each page has a specific purpose in the application.

The `index.html` file is the main page of the website. The `expenses.html` page is used to display expenses, while `add.html` provides a form for adding a new expense. The `edit.html` page allows an existing expense to be changed. The `details.html` page shows more information about an expense. The `statistics.html` and `categories.html` pages are used to organize and display expense information in a more useful way. The `about.html` page provides information about the project.

I used CSS to control the appearance and layout of the website. The main stylesheet is located in `static/css/style.css`. I wanted the interface to be simple and easy to understand rather than making it unnecessarily complicated.

I also used JavaScript in `static/js/script.js`. JavaScript adds client-side functionality and allows the website to respond to user actions without putting everything on the server. I used it together with Flask so that the frontend and backend can work together.

One of the design decisions I made was to keep the project separated into different parts. Flask and Python handle the backend logic, SQLite handles data storage, HTML provides the page structure, CSS handles the design, and JavaScript provides additional interaction. Keeping these parts separated made the project easier to understand and maintain.

I also used a Flask API so that the JavaScript code can communicate with the Python backend and perform the different expense operations. This helped me understand how different parts of a web application communicate with each other and how data can move between the frontend and backend.

Building this project gave me more practice with Python and Flask, but it also helped me understand how a complete web application is put together. Instead of working on individual programming exercises, I had to think about how the different files and technologies would work together as one application.

One of the things I learned from this project was that building a web application involves more than writing code for one feature. I had to think about the database structure, the routes, the pages, the user interface, and how the frontend communicates with the backend. I also learned that keeping the project organized makes it easier to find and fix problems.

The main files in the project are `app.py`, `expenses.db`, `requirements.txt`, the HTML files inside the `templates` folder, and the CSS and JavaScript files inside the `static` folder. `app.py` contains the main Flask application and backend logic. `expenses.db` is the SQLite database. `requirements.txt` contains the Python packages required to run the project.

To run the project, the required packages should first be installed from `requirements.txt`. After that, the Flask application can be started using the appropriate Flask command, and the website can be opened in a web browser.

I made this project to have a simple way to record and manage expenses. It was also a good way for me to practice building a complete web application using Python, Flask, SQLite, HTML, CSS, and JavaScript.

In the future, I could improve the project by adding more advanced statistics, better filtering and searching, authentication for multiple users, and additional ways to visualize spending. However, the current version focuses on providing a simple and understandable expense tracking application.

Overall, this project represents what I learned during CS50 and gave me the opportunity to combine programming, databases, backend development, and frontend development into one application.
