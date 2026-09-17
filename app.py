

import os
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import Flask, g, jsonify, render_template, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "expenses.db")

CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"]


# =========================================================
# Database helpers
# =========================================================

def get_db():
    """Open (or reuse) a SQLite connection for the current request."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the expenses table if it doesn't exist yet."""
    db = sqlite3.connect(DB_PATH)
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL CHECK (amount > 0),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
        """
    )
    db.commit()
    db.close()


def row_to_dict(row):
    return dict(row) if row is not None else None


# =========================================================
# Validation
# =========================================================

def validate_expense_payload(data):
    """Returns an error message string, or None if the payload is valid."""
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")

    try:
        amount_value = float(amount)
    except (TypeError, ValueError):
        return "Amount must be a number greater than 0."
    if amount_value <= 0:
        return "Amount must be greater than 0."

    if not category or category not in CATEGORIES:
        return "Please select a valid category."

    if not date:
        return "Date is required."

    return None


# =========================================================
# Page routes (server-rendered templates)
# =========================================================

@app.route("/")
@app.route("/index.html")
def page_dashboard():
    return render_template("index.html")


@app.route("/expenses.html")
def page_expenses():
    return render_template("expenses.html")


@app.route("/add.html")
def page_add():
    return render_template("add.html")


@app.route("/edit.html")
def page_edit():
    return render_template("edit.html")


@app.route("/details.html")
def page_details():
    return render_template("details.html")


@app.route("/categories.html")
def page_categories():
    return render_template("categories.html")


@app.route("/statistics.html")
def page_statistics():
    return render_template("statistics.html")


@app.route("/about.html")
def page_about():
    return render_template("about.html")


# =========================================================
# JSON API routes (used by static/js/script.js)
# =========================================================

@app.route("/api/expenses", methods=["GET"])
def api_list_expenses():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM expenses ORDER BY date DESC, created_at DESC"
    ).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/expenses/<expense_id>", methods=["GET"])
def api_get_expense(expense_id):
    db = get_db()
    row = db.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Expense not found."}), 404
    return jsonify(row_to_dict(row))


@app.route("/api/expenses", methods=["POST"])
def api_create_expense():
    data = request.get_json(silent=True) or {}
    error = validate_expense_payload(data)
    if error:
        return jsonify({"error": error}), 400

    expense_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    db = get_db()
    db.execute(
        """
        INSERT INTO expenses (id, amount, category, date, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            expense_id,
            float(data["amount"]),
            data["category"],
            data["date"],
            data.get("note", "") or "",
            created_at,
        ),
    )
    db.commit()

    row = db.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    return jsonify(row_to_dict(row)), 201


@app.route("/api/expenses/<expense_id>", methods=["PUT"])
def api_update_expense(expense_id):
    db = get_db()
    existing = db.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Expense not found."}), 404

    data = request.get_json(silent=True) or {}
    error = validate_expense_payload(data)
    if error:
        return jsonify({"error": error}), 400

    db.execute(
        """
        UPDATE expenses
        SET amount = ?, category = ?, date = ?, note = ?
        WHERE id = ?
        """,
        (
            float(data["amount"]),
            data["category"],
            data["date"],
            data.get("note", "") or "",
            expense_id,
        ),
    )
    db.commit()

    row = db.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    return jsonify(row_to_dict(row))


@app.route("/api/expenses/<expense_id>", methods=["DELETE"])
def api_delete_expense(expense_id):
    db = get_db()
    existing = db.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Expense not found."}), 404

    db.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    db.commit()
    return jsonify({"deleted": True, "id": expense_id})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
else:
    # Also make sure the table exists when run through a WSGI server.
    init_db()
