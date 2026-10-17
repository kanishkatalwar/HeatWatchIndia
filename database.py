import os

import mysql.connector


def get_connection():
    """Open a MySQL connection.

    Settings are read from environment variables when they exist, and fall
    back to the original local values so the project keeps working unchanged.
    Set DB_PASSWORD (and friends) in your PyCharm run configuration to keep
    the real password out of the source code.
    """
    connection = mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "root"),
        database=os.environ.get("DB_NAME", "heatwatch_india")
    )

    return connection


def query_all(sql, params=None):
    """Run a SELECT and return every row as a dict (parameterised)."""
    connection = get_connection()

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        rows = cursor.fetchall()
        cursor.close()
        return rows

    finally:
        connection.close()