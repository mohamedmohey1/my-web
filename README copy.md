# Expense Tracker (Flask + SQLite)

## Setup
```bash
pip install -r requirements.txt
python app.py
```
Then open http://127.0.0.1:5000 in your browser.

## Notes
- The SQLite database file `expenses.db` is created automatically the first time you run the app.
- All pages (Dashboard, Expenses, Add, Edit, Details, Categories, Statistics, About) are served by Flask from `templates/`.
- The frontend JavaScript (`static/js/script.js`) talks to the JSON API below instead of using localStorage:
  - `GET    /api/expenses`        - list all expenses
  - `GET    /api/expenses/<id>`   - get one expense
  - `POST   /api/expenses`        - create an expense
  - `PUT    /api/expenses/<id>`   - update an expense
  - `DELETE /api/expenses/<id>`   - delete an expense
